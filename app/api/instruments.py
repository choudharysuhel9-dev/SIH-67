"""
app/api/instruments.py

Thin route layer - all logic lives in app/services/instrument_service.py.
"""

from typing import Optional

from fastapi import APIRouter, Query

from app.schemas.instrument import (
    InstrumentsResponse,
    InstrumentDetail,
    InstrumentProfileResponse,
)
from app.services import instrument_service

router = APIRouter(tags=["Instruments"])


@router.get("/instruments", response_model=InstrumentsResponse)
def get_instruments(
    instrument_type: Optional[str] = Query(
        None, description="Filter by 'ARGO' or 'GLIDER'"
    ),
):
    """List instrument markers, optionally filtered by type."""
    return InstrumentsResponse(
        instruments=instrument_service.list_instruments(instrument_type)
    )


@router.get("/instruments/{instrument_id}", response_model=InstrumentDetail)
def get_instrument(instrument_id: str):
    """Return metadata for a single instrument."""
    return instrument_service.get_instrument(instrument_id)


@router.get(
    "/instruments/{instrument_id}/profile", response_model=InstrumentProfileResponse
)
def get_instrument_profile(instrument_id: str):
    """Return the depth vs. temperature/salinity profile for an instrument."""
    return instrument_service.get_instrument_profile(instrument_id)
