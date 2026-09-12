"""
api.py
======
Member 3-facing FastAPI application for the Ocean Data Optimization Layer.

Architecture
------------
  HTTP request
    -> QueryParams (built here)
    -> Adapter (CopernicusNetCDFAdapter)
    -> CommonOceanDataset
    -> OceanDataOptimizer
    -> OptimizedResult
    -> JSON response (via OptimizedResult.to_dict())

Responsibilities of this file
------------------------------
* HTTP routing and parameter parsing
* Adapter instantiation (once, at startup)
* Optimizer instantiation (once, per loaded dataset)
* Cache lookup / storage
* JSON serialisation via OptimizedResult.to_dict()

NOT responsible for
-------------------
* Variable mapping (e.g. thetao -> temperature) - that is the adapter''s job
* Coarsening logic - that is the optimizer''s job
* Adaptive resolution - that is the optimizer''s job
* Validation of ocean query semantics - that is the optimizer''s job
"""

from __future__ import annotations

import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from ocean_data_layer.adapters.copernicus_adapter import CopernicusNetCDFAdapter
from ocean_data_layer.optimizer import OceanDataOptimizer, QueryParams
from ocean_data_layer.cache import OptimizerCache, make_cache_key


# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Ocean Data Optimization Layer API",
    description=(
        "Member 5 - provides spatially-optimised ocean data "
        "to Member 3 (Backend/API) and Member 1 (3D Visualization)."
    ),
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Dataset / optimizer setup
# ---------------------------------------------------------------------------

_TEST_FILE = (
    "cmems_mod_glo_phy_my_0.083deg_P1D-m_thetao_"
    "70.00E-75.00E_10.00N-15.00N_0.49-92.33m_"
    "2020-01-01-2020-01-03.nc"
)

_DATA_FILE = os.environ.get("OCEAN_DATA_FILE", _TEST_FILE)

_adapter  = None
_dataset  = None
_optimizer = None

def _get_optimizer() -> OceanDataOptimizer:
    """Lazy-initialise the optimizer on first request."""
    global _adapter, _dataset, _optimizer
    if _optimizer is None:
        if not os.path.isfile(_DATA_FILE):
            raise RuntimeError(
                f"Ocean data file not found: {_DATA_FILE!r}. "
                f"Set the OCEAN_DATA_FILE environment variable to the correct path."
            )
        _adapter  = CopernicusNetCDFAdapter()
        _dataset  = _adapter.load(file_path=_DATA_FILE)
        _optimizer = OceanDataOptimizer(_dataset)
    return _optimizer


# ---------------------------------------------------------------------------
# Cache
# ---------------------------------------------------------------------------

_cache = OptimizerCache(max_size=128)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "Ocean Data Optimization Layer API is running.",
        "version": "2.0.0",
        "endpoints": ["/ocean/temperature", "/cache/stats"],
    }


@app.get("/ocean/temperature")
def temperature(
    date: str,
    depth_min: float = None,
    depth_max: float = None,
    lat_min: float = None,
    lat_max: float = None,
    lon_min: float = None,
    lon_max: float = None,
    step: int = None,
    adaptive: bool = True,
    max_output_points: int = 500_000,
):
    """
    Return optimised ocean temperature data for the requested region.

    Parameters
    ----------
    date : str
        ISO-8601 date, e.g. ``2020-01-02``.
    depth_min, depth_max : float, optional
        Depth range in metres (positive downward).
    lat_min, lat_max : float, optional
        Latitude range in degrees North.
    lon_min, lon_max : float, optional
        Longitude range in degrees East.
    step : int, optional
        Explicit coarsening factor.  Mutually exclusive with adaptive.
    adaptive : bool
        Automatically select the smallest step that fits max_output_points.
    max_output_points : int
        Upper bound on the number of returned data points.
    """
    # Build cache key first (before any expensive work)
    cache_key = make_cache_key(
        source=_DATA_FILE,          # source identifier for the cache
        variable="temperature",
        date=date,
        depth_min=depth_min,
        depth_max=depth_max,
        lat_min=lat_min,
        lat_max=lat_max,
        lon_min=lon_min,
        lon_max=lon_max,
        step=step,
        adaptive=adaptive,
        max_output_points=max_output_points,
    )

    if _cache.has(cache_key):
        print("CACHE HIT")
        return _cache.get(cache_key)

    print("CACHE MISS")

    try:
        optimizer = _get_optimizer()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    params = QueryParams(
        variable="temperature",
        date=date,
        depth_min=depth_min,
        depth_max=depth_max,
        lat_min=lat_min,
        lat_max=lat_max,
        lon_min=lon_min,
        lon_max=lon_max,
        step=step,
        adaptive=adaptive,
        max_output_points=max_output_points,
    )

    try:
        result = optimizer.optimize(params)
        response = result.to_dict()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    _cache.put(cache_key, response)
    return response


@app.get("/cache/stats")
def cache_stats():
    """Return current cache utilisation statistics."""
    return {
        "size":     _cache.size,
        "max_size": _cache.max_size,
    }
