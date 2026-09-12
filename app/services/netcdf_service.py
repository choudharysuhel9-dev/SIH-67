"""
app/services/netcdf_service.py

Real ocean-model data access via xarray, backed by the Copernicus
Marine GLORYS12V1 NetCDF file configured via NETCDF_DATA_PATH.

Backs: GET /api/variables, GET /api/times, GET /api/depths, GET /api/model.

Per Task 4 scope, these stay on Task 3's mock services and are NOT
touched here: /api/current (current_service.py), /api/instruments
(instrument_service.py), /api/compare (comparison_service.py, which
still uses model_service._mock_value for the "model" side).

VARIABLE_MAP is the single place that knows the real Copernicus
variable names (thetao/so/uo/vo) - confirmed by the user against
their actual downloaded file, not guessed here. Every other module
(schemas, api/) only ever sees the friendly ids used throughout the
rest of the API (temperature, salinity, current_u, current_v).
"""

import os
from typing import List, Optional

import numpy as np
import xarray as xr
from fastapi import HTTPException

from app.core import config as core_config

# Friendly API variable id -> real NetCDF variable name.
VARIABLE_MAP = {
    "temperature": "thetao",
    "salinity": "so",
    "current_u": "uo",
    "current_v": "vo",
}

VARIABLE_META = {
    "temperature": {"name": "Temperature", "unit": "°C"},
    "salinity": {"name": "Salinity", "unit": "PSU"},
    "current_u": {"name": "Eastward Current (U)", "unit": "m/s"},
    "current_v": {"name": "Northward Current (V)", "unit": "m/s"},
}


def _dataset_path() -> str:
    """Read fresh from the environment each call (not a frozen import-time
    constant) so tests can monkeypatch NETCDF_DATA_PATH per-test."""
    return os.environ.get("NETCDF_DATA_PATH", core_config.NETCDF_DATA_PATH)


def open_dataset() -> xr.Dataset:
    """Open the configured NetCDF file. Returns a context-manager-capable
    xr.Dataset; caller should use `with open_dataset() as ds:` so the file
    handle is always closed, even on error."""
    path = _dataset_path()

    if not path or not os.path.isfile(path):
        raise HTTPException(
            status_code=500,
            detail={
                "error": "NetCDF file not found",
                "message": (
                    f"No file at '{path}'. Set NETCDF_DATA_PATH in .env "
                    "to point at your downloaded Copernicus subset."
                ),
            },
        )

    try:
        return xr.open_dataset(path)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to open NetCDF dataset", "message": str(exc)},
        )


def _require_coord(ds: xr.Dataset, name: str) -> None:
    if name not in ds.coords:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Missing coordinate",
                "message": f"Dataset has no '{name}' coordinate",
            },
        )


def _format_time(t: np.datetime64) -> str:
    return np.datetime_as_string(t, unit="s") + "Z"


def list_available_variables() -> List[dict]:
    """Only advertises an API variable id if its mapped NetCDF variable
    is ACTUALLY present in the file - never claims something that isn't
    really there."""
    with open_dataset() as ds:
        present = set(ds.data_vars.keys())

    return [
        {
            "id": api_id,
            "name": VARIABLE_META[api_id]["name"],
            "unit": VARIABLE_META[api_id]["unit"],
        }
        for api_id, nc_name in VARIABLE_MAP.items()
        if nc_name in present
    ]


def list_times() -> List[str]:
    with open_dataset() as ds:
        _require_coord(ds, "time")
        times = ds["time"].values
    return [_format_time(t) for t in times]


def list_depths() -> List[float]:
    with open_dataset() as ds:
        _require_coord(ds, "depth")
        depths = ds["depth"].values
    return [round(float(d), 3) for d in depths]


def _resolve_nc_variable(variable: str, ds: xr.Dataset) -> str:
    if variable not in VARIABLE_MAP:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Unsupported variable",
                "message": f"Variable '{variable}' is not available",
                "available_variables": list(VARIABLE_MAP.keys()),
            },
        )
    nc_name = VARIABLE_MAP[variable]
    if nc_name not in ds.data_vars:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Variable missing from file",
                "message": (
                    f"Expected NetCDF variable '{nc_name}' for API variable "
                    f"'{variable}', but it is not present in the dataset."
                ),
            },
        )
    return nc_name


def spatial_subset(
    da: xr.DataArray,
    min_lat: Optional[float] = None,
    max_lat: Optional[float] = None,
    min_lon: Optional[float] = None,
    max_lon: Optional[float] = None,
) -> xr.DataArray:
    """Reusable lat/lon bounding-box subset for any DataArray that has
    'latitude'/'longitude' coordinates.

    Uses xr.DataArray.sel() with coordinate slices, which is lazy - no
    data is read into memory here, only a smaller "view" of the array
    is selected. Data is only actually loaded when the caller later
    calls .load() (as get_model_data() does, after this subset).

    All four bounds are optional; any bound left as None leaves that
    side of the box open (i.e. the array's full existing extent), so
    calling spatial_subset(da) with no bounds is a no-op.

    NOTE: assumes latitude/longitude coordinates are stored in
    ascending order (standard for CMEMS/GLORYS12V1 - confirmed via
    scripts/inspect_netcdf.py). If a future dataset has descending
    coordinates, the slice direction here would need to flip to match.
    """
    lat_slice = slice(min_lat, max_lat)
    lon_slice = slice(min_lon, max_lon)
    return da.sel(latitude=lat_slice, longitude=lon_slice)


def get_model_data(
    variable: str,
    depth: float,
    time: str,
    min_lat: Optional[float] = None,
    max_lat: Optional[float] = None,
    min_lon: Optional[float] = None,
    max_lon: Optional[float] = None,
) -> dict:
    """Return a lat/lon grid for one variable/depth/time, read straight
    from the real NetCDF file. Selection (.sel/.isel) happens before
    .load(), so only the requested slice is ever actually pulled into
    memory - not the whole file.

    The four spatial bounds are optional and default to None (= full
    grid, exactly Task 3/4's existing behavior) - api/model.py does not
    pass them yet, so the public API contract is unchanged. They exist
    so a future task can add bbox query params to the route without
    touching this function's core logic again.
    """
    with open_dataset() as ds:
        nc_name = _resolve_nc_variable(variable, ds)
        _require_coord(ds, "time")
        _require_coord(ds, "depth")
        _require_coord(ds, "latitude")
        _require_coord(ds, "longitude")

        depths = ds["depth"].values
        depth_min, depth_max = float(depths.min()), float(depths.max())
        if depth < 0 or depth > depth_max:
         raise HTTPException(
        status_code=400,
        detail={
            "error": "Invalid depth",
            "message": f"Depth {depth} is outside the valid range [0, {depth_max}]",
        },
    )

        times = ds["time"].values
        time_strs = [_format_time(t) for t in times]
        if time not in time_strs:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Invalid time",
                    "message": f"Time '{time}' is not an available time step",
                    "available_times": time_strs,
                },
            )

        try:
            time_index = time_strs.index(time)
            da = ds[nc_name].isel(time=time_index).sel(depth=depth, method="nearest")
            da = spatial_subset(da, min_lat, max_lat, min_lon, max_lon)
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(
                status_code=400,
                detail={"error": "Invalid selection", "message": str(exc)},
            )

        if da.sizes.get("latitude", 0) == 0 or da.sizes.get("longitude", 0) == 0:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Empty spatial selection",
                    "message": "The requested lat/lon bounding box has no grid points in it",
                },
            )

        # .load() here materializes ONLY this (possibly bbox-subsetted)
        # 2D (latitude, longitude) slice - not the full file.
        da = da.load()

        resolved_depth = float(da["depth"].values)
        resolved_time = _format_time(np.datetime64(da["time"].values))
        latitude = [float(v) for v in da["latitude"].values]
        longitude = [float(v) for v in da["longitude"].values]

        raw = da.values  # shape (latitude, longitude)
        values: List[List[Optional[float]]] = [
            [None if np.isnan(v) else round(float(v), 4) for v in row]
            for row in raw
        ]

    return {
        "variable": variable,
        "unit": VARIABLE_META[variable]["unit"],
        "depth": resolved_depth,
        "time": resolved_time,
        "latitude": latitude,
        "longitude": longitude,
        "values": values,
    }
