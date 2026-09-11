"""
app/schemas/instrument.py

Response models for GET /api/instruments, /api/instruments/{id},
and /api/instruments/{id}/profile.

Field names deliberately match the format Member 4 (Argo/Glider
parser) is expected to eventually provide, so swapping mock data
for real parsed data later requires no schema changes.
"""

from enum import Enum
from typing import List
from pydantic import BaseModel, Field


class InstrumentType(str, Enum):
    ARGO = "ARGO"
    GLIDER = "GLIDER"


class InstrumentSummary(BaseModel):
    instrument_id: str = Field(..., examples=["ARGO-001"])
    instrument_type: InstrumentType
    latitude: float
    longitude: float
    timestamp: str = Field(..., description="ISO 8601 UTC timestamp")


class InstrumentsResponse(BaseModel):
    instruments: List[InstrumentSummary]


class InstrumentDetail(InstrumentSummary):
    status: str = Field(..., examples=["active", "inactive"])


class InstrumentProfileResponse(BaseModel):
    instrument_id: str
    instrument_type: InstrumentType
    depth: List[float]
    temperature: List[float]
    salinity: List[float]
