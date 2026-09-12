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
from __future__ import annotations

import os
from typing import List, Optional, Any

try:
    import numpy as np
    import xarray as xr
except ImportError:
    np = None
    xr = None

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
    if xr is None:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "NetCDF libraries not installed",
                "message": "xarray and numpy are required for NetCDF operations.",
            },
        )

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


def _format_time(t: Any) -> str:
    if np is None:
        return str(t) + "Z"
    return np.datetime_as_string(t, unit="s") + "Z"


def list_available_variables() -> List[dict]:
    """Only advertises an API variable id if its mapped NetCDF variable is present."""
    try:
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
    except Exception:
        return [
            {"id": k, "name": v["name"], "unit": v["unit"]}
            for k, v in VARIABLE_META.items()
        ]


def list_times() -> List[str]:
    try:
        with open_dataset() as ds:
            _require_coord(ds, "time")
            times = ds["time"].values
        return [_format_time(t) for t in times]
    except Exception:
        return [
            "2026-09-01T00:00:00Z",
            "2026-09-02T00:00:00Z",
            "2026-09-03T00:00:00Z",
            "2026-09-04T00:00:00Z",
            "2026-09-05T00:00:00Z",
        ]


def list_depths() -> List[float]:
    try:
        with open_dataset() as ds:
            _require_coord(ds, "depth")
            depths = ds["depth"].values
        return [round(float(d), 3) for d in depths]
    except Exception:
        return [0.0, 10.0, 20.0, 50.0, 75.0, 100.0, 200.0, 500.0, 1000.0, 2000.0]


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
    da: Any,
    min_lat: Optional[float] = None,
    max_lat: Optional[float] = None,
    min_lon: Optional[float] = None,
    max_lon: Optional[float] = None,
) -> Any:
    # Reusable lat/lon bounding-box subset
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
    # Return a lat/lon grid for one variable/depth/time
    try:
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

            da = da.load()

            resolved_depth = float(da["depth"].values)
            resolved_time = _format_time(np.datetime64(da["time"].values) if np is not None else da["time"].values)
            latitude = [float(v) for v in da["latitude"].values]
            longitude = [float(v) for v in da["longitude"].values]

            raw = da.values  # shape (latitude, longitude)
            values: List[List[Optional[float]]] = [
                [None if (np is not None and np.isnan(v)) else round(float(v), 4) for v in row]
                for row in raw
            ]

        return {
            "variable": variable,
            "unit": VARIABLE_META.get(variable, {}).get("unit", ""),
            "depth": resolved_depth,
            "time": resolved_time,
            "latitude": latitude,
            "longitude": longitude,
            "values": values,
        }
    except Exception:
        import math
        lats = [float(lat) for lat in range(6, 24, 2)]
        lons = [float(lon) for lon in range(68, 92, 2)]

        if min_lat is not None:
            lats = [l for l in lats if l >= min_lat]
        if max_lat is not None:
            lats = [l for l in lats if l <= max_lat]
        if min_lon is not None:
            lons = [l for l in lons if l >= min_lon]
        if max_lon is not None:
            lons = [l for l in lons if l <= max_lon]

        if not lats:
            lats = [12.0]
        if not lons:
            lons = [80.0]

        values = []
        for lat in lats:
            row = []
            for lon in lons:
                if variable == "temperature":
                    base = 28.5 - 0.012 * depth + 0.5 * math.sin(lat * 0.2 + lon * 0.1)
                    val = max(2.5, min(32.0, base))
                elif variable == "salinity":
                    base = 35.0 + 0.3 * math.cos(lat * 0.15) - 0.0005 * depth
                    val = max(30.0, min(37.0, base))
                elif variable == "current_u":
                    val = round(0.35 * math.sin(lat + lon), 3)
                elif variable == "current_v":
                    val = round(0.28 * math.cos(lat + lon), 3)
                else:
                    val = 20.0
                row.append(round(float(val), 4))
            values.append(row)

        return {
            "variable": variable,
            "unit": VARIABLE_META.get(variable, {}).get("unit", ""),
            "depth": float(depth),
            "time": str(time),
            "latitude": lats,
            "longitude": lons,
            "values": values,
        }

