"""
app/api/datasets.py

Thin route layer - all logic lives in app/services/dataset_service.py.
"""

from fastapi import APIRouter

from app.schemas.dataset import (
    DatasetsResponse,
    VariablesResponse,
    TimesResponse,
    DepthsResponse,
)
from app.services import dataset_service

router = APIRouter(tags=["Datasets"])


@router.get("/datasets", response_model=DatasetsResponse)
def get_datasets():
    """List available datasets (ocean_model, argo, glider)."""
    return DatasetsResponse(datasets=dataset_service.list_datasets())


@router.get("/variables", response_model=VariablesResponse)
def get_variables():
    """List variables available across datasets, with units."""
    return VariablesResponse(variables=dataset_service.list_variables())


@router.get("/times", response_model=TimesResponse)
def get_times():
    """List available model time steps (ISO 8601 UTC)."""
    return TimesResponse(times=dataset_service.list_times())


@router.get("/depths", response_model=DepthsResponse)
def get_depths():
    """List available depth levels, in meters."""
    return DepthsResponse(depths=dataset_service.list_depths())
