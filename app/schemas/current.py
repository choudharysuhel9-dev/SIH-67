"""
app/schemas/current.py

Response model for GET /api/current.

Returns a list of points rather than a raw grid, since Member 1 will
render these as individual arrows/particles in Cesium (each point
needs its own position, speed, and direction — a flat list maps
directly to that, unlike the /api/model grid which is a continuous
color-mapped surface).
"""

from typing import List
from pydantic import BaseModel, Field


class CurrentPoint(BaseModel):
    latitude: float
    longitude: float
    u: float = Field(..., description="Eastward velocity component (m/s)")
    v: float = Field(..., description="Northward velocity component (m/s)")
    speed: float = Field(..., description="sqrt(u^2 + v^2), in m/s")
    direction: float = Field(..., description="Degrees clockwise from east, 0-360")


class CurrentResponse(BaseModel):
    depth: float
    time: str
    points: List[CurrentPoint]
