"""
app/api/current.py

Thin route layer - all logic lives in app/services/current_service.py.
"""

from fastapi import APIRouter, Query

from app.schemas.current import CurrentResponse
from app.services import current_service

router = APIRouter(tags=["Current"])


@router.get("/current", response_model=CurrentResponse)
def get_current(
    depth: float = Query(..., description="Depth in meters"),
    time: str = Query(..., description="ISO 8601 timestamp"),
):
    """Return current vectors (u, v, speed, direction) at a depth/time."""
    return current_service.get_current(depth, time)
