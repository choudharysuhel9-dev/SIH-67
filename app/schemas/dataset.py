"""
app/schemas/dataset.py

Response models for GET /api/datasets, /api/variables, /api/times, /api/depths.
"""

from typing import List
from pydantic import BaseModel, Field


class DatasetInfo(BaseModel):
    id: str = Field(..., examples=["ocean_model"])
    name: str = Field(..., examples=["Ocean Model Output"])
    description: str


class DatasetsResponse(BaseModel):
    datasets: List[DatasetInfo]


class VariableInfo(BaseModel):
    id: str = Field(..., examples=["temperature"])
    name: str = Field(..., examples=["Temperature"])
    unit: str = Field(..., examples=["°C"])


class VariablesResponse(BaseModel):
    variables: List[VariableInfo]


class TimesResponse(BaseModel):
    times: List[str] = Field(..., description="ISO 8601 UTC timestamps")


class DepthsResponse(BaseModel):
    depths: List[float]
    unit: str = "meters"
