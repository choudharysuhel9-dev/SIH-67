"""
app/api/compare.py

Thin route layer - all logic lives in app/services/comparison_service.py.
"""

from fastapi import APIRouter, Query

from app.schemas.comparison import CompareResponse
from app.services import comparison_service

router = APIRouter(tags=["Compare"])


@router.get("/compare", response_model=CompareResponse)
def compare(
    instrument_id: str = Query(..., description="Instrument id, e.g. 'ARGO-001'"),
    variable: str = Query(..., description="Variable to compare, e.g. 'temperature'"),
):
    """Compare an instrument's observed profile against the model at its location."""
    return comparison_service.compare(instrument_id, variable)
