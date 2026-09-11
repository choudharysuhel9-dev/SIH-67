"""
app/schemas/comparison.py

Response model for GET /api/compare — the project's signature feature.
"""

from typing import List
from pydantic import BaseModel, Field


class ComparisonMetrics(BaseModel):
    rmse: float = Field(..., description="Root Mean Squared Error")
    mae: float = Field(..., description="Mean Absolute Error")
    bias: float = Field(..., description="Mean(model - observation); sign shows over/under-prediction")


class CompareResponse(BaseModel):
    instrument_id: str
    variable: str
    depth: List[float]
    observation: List[float] = Field(..., description="Instrument-measured values per depth")
    model: List[float] = Field(..., description="Model-predicted values per depth, same order as observation")
    metrics: ComparisonMetrics
