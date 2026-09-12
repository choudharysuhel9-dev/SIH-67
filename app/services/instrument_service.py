"""
app/services/instrument_service.py

Backs GET /api/instruments, /api/instruments/{id}, and
/api/instruments/{id}/profile.

STATUS: Mock data only. _MOCK_INSTRUMENTS uses the exact field shape
Member 4's real Argo/Glider parser is expected to provide (see the
"Member 4 -> Member 3" contract), so replacing this dict with a real
data source later won't require changing api/instruments.py or the
Pydantic schemas.
"""

from typing import List, Optional

from fastapi import HTTPException

from app.core.constants import DEPTHS
from app.schemas.instrument import (
    InstrumentType,
    InstrumentSummary,
    InstrumentDetail,
    InstrumentProfileResponse,
)

_MOCK_INSTRUMENTS = {
    "ARGO-001": {
        "instrument_type": InstrumentType.ARGO,
        "latitude": 12.31,
        "longitude": 73.42,
        "timestamp": "2020-01-01T00:00:00Z",
        "status": "active",
    },
    "ARGO-002": {
        "instrument_type": InstrumentType.ARGO,
        "latitude": 15.10,
        "longitude": 70.20,
        "timestamp": "2020-01-03T00:00:00Z",
        "status": "active",
    },
    "GLIDER-001": {
        "instrument_type": InstrumentType.GLIDER,
        "latitude": 10.55,
        "longitude": 74.80,
        "timestamp": "2020-01-01T00:00:00Z",
        "status": "active",
    },
    "GLIDER-002": {
        "instrument_type": InstrumentType.GLIDER,
        "latitude": 18.90,
        "longitude": 71.50,
        "timestamp": "2020-01-02T00:00:00Z",
        "status": "inactive",
    },
}


def validate_instrument_type(instrument_type: Optional[str]) -> None:
    if instrument_type is None:
        return
    valid_types = {t.value for t in InstrumentType}
    if instrument_type.upper() not in valid_types:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Invalid instrument type",
                "message": f"'{instrument_type}' is not a supported instrument type",
                "available_types": sorted(valid_types),
            },
        )


def list_instruments(instrument_type: Optional[str] = None) -> List[InstrumentSummary]:
    validate_instrument_type(instrument_type)

    results = []
    for instrument_id, data in _MOCK_INSTRUMENTS.items():
        if instrument_type and data["instrument_type"].value != instrument_type.upper():
            continue
        results.append(
            InstrumentSummary(
                instrument_id=instrument_id,
                instrument_type=data["instrument_type"],
                latitude=data["latitude"],
                longitude=data["longitude"],
                timestamp=data["timestamp"],
            )
        )
    return results


def _get_raw_instrument(instrument_id: str) -> dict:
    data = _MOCK_INSTRUMENTS.get(instrument_id)
    if not data:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "Instrument not found",
                "message": f"No instrument found with id '{instrument_id}'",
            },
        )
    return data


def get_instrument(instrument_id: str) -> InstrumentDetail:
    data = _get_raw_instrument(instrument_id)
    return InstrumentDetail(
        instrument_id=instrument_id,
        instrument_type=data["instrument_type"],
        latitude=data["latitude"],
        longitude=data["longitude"],
        timestamp=data["timestamp"],
        status=data["status"],
    )


def get_instrument_profile(instrument_id: str) -> InstrumentProfileResponse:
    data = _get_raw_instrument(instrument_id)

    depths = [float(d) for d in DEPTHS]
    # Realistic Indian Ocean thermocline (29.1°C surface, steep thermocline drop, 3.3°C deep)
    temperature = [round(2.6 + 26.5 / (1.0 + (d / 120.0)**1.25), 2) for d in depths]
    # Realistic halocline (34.8 PSU surface, subsurface salinity max, 34.6 PSU deep)
    salinity = [round(34.6 + 0.8 / (1.0 + ((d - 80.0) / 120.0)**2), 2) for d in depths]

    return InstrumentProfileResponse(
        instrument_id=instrument_id,
        instrument_type=data["instrument_type"],
        depth=depths,
        temperature=temperature,
        salinity=salinity,
    )
