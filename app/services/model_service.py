from datetime import datetime
from typing import Optional

from fastapi import HTTPException

from app.services import netcdf_service
from app.schemas.model import ModelDataResponse


def validate_variable(variable: str) -> None:
    available_variables = netcdf_service.list_available_variables()

    available_ids = [item["id"] for item in available_variables]

    if variable not in available_ids:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Unsupported variable",
                "message": f"Variable '{variable}' is not available",
                "available_variables": available_ids,
            },
        )


def validate_depth(depth: float) -> None:
    depths = netcdf_service.list_depths()

    if not depths:
        raise HTTPException(
            status_code=500,
            detail="No depth data available in NetCDF dataset",
        )

    max_depth = max(depths)

    # Allow observation depths from 0 m up to
    # the deepest available model level.
    if depth < 0 or depth > max_depth:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Invalid depth",
                "message": (
                    f"Depth {depth} is outside the valid range "
                    f"[0, {max_depth}]"
                ),
            },
        )

def validate_time(time: str) -> None:
    try:
        datetime.fromisoformat(time.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Invalid time",
                "message": (
                    f"Time '{time}' is not a valid ISO 8601 timestamp"
                ),
            },
        )


def get_model_data(
    variable: str,
    depth: float,
    time: str,
    min_lon: Optional[float] = None,
    max_lon: Optional[float] = None,
    min_lat: Optional[float] = None,
    max_lat: Optional[float] = None,
) -> ModelDataResponse:

    validate_variable(variable)
    validate_depth(depth)
    validate_time(time)

    return netcdf_service.get_model_data(
        variable=variable,
        depth=depth,
        time=time,
        min_lon=min_lon,
        max_lon=max_lon,
        min_lat=min_lat,
        max_lat=max_lat,
    )