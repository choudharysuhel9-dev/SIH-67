"""
app/schemas/model.py

Response model for GET /api/model.

This is the core "data contract" with the frontend (Member 1): a
flat grid of latitude/longitude plus a 2D values array indexed as
values[lat_index][lon_index]. Cesium can consume this directly
without knowing anything about NetCDF internals.
"""

from typing import List
from pydantic import BaseModel, Field


class ModelDataResponse(BaseModel):
    variable: str = Field(..., examples=["temperature"])
    unit: str = Field(..., examples=["°C"])
    depth: float = Field(..., examples=[50])
    time: str = Field(..., examples=["2026-09-03T12:00:00Z"])
    latitude: List[float] = Field(..., description="Grid latitude values, ascending")
    longitude: List[float] = Field(..., description="Grid longitude values, ascending")
    values: List[List[float]] = Field(
        ..., description="2D grid indexed as values[lat_index][lon_index]"
    )
