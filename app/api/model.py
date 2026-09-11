"""
app/api/model.py

Thin route layer - all logic lives in app/services/model_service.py.
"""

from typing import Optional

from fastapi import APIRouter, Query

from app.schemas.model import ModelDataResponse
from app.services import model_service

router = APIRouter(tags=["Model"])


@router.get("/model", response_model=ModelDataResponse)
def get_model(
    variable: str = Query(
        ...,
        description="Variable id, e.g. 'temperature'"
    ),
    depth: float = Query(
        ...,
        description="Depth in meters, e.g. 50"
    ),
    time: str = Query(
        ...,
        description="ISO 8601 timestamp, e.g. 2026-09-03T12:00:00Z"
    ),
    min_lon: Optional[float] = Query(
        None,
        description="Minimum longitude, e.g. 70"
    ),
    max_lon: Optional[float] = Query(
        None,
        description="Maximum longitude, e.g. 72"
    ),
    min_lat: Optional[float] = Query(
        None,
        description="Minimum latitude, e.g. 10"
    ),
    max_lat: Optional[float] = Query(
        None,
        description="Maximum latitude, e.g. 12"
    ),
):
    """Return a gridded model field for a given variable/depth/time and optional geographic bounds."""

    return model_service.get_model_data(
        variable,
        depth,
        time,
        min_lon=min_lon,
        max_lon=max_lon,
        min_lat=min_lat,
        max_lat=max_lat,
    )
