"""
app/services/dataset_service.py

Dataset metadata and coordinate access.

Real model time and depth coordinates are read from the
configured NetCDF dataset through netcdf_service.
"""

from typing import List

from app.core.constants import SUPPORTED_VARIABLES, DATASETS
from app.schemas.dataset import DatasetInfo, VariableInfo
from app.services import netcdf_service


def list_datasets() -> List[DatasetInfo]:
    return [DatasetInfo(**d) for d in DATASETS]


def list_variables() -> List[VariableInfo]:
    return [
        VariableInfo(
            id=var_id,
            name=meta["name"],
            unit=meta["unit"]
        )
        for var_id, meta in SUPPORTED_VARIABLES.items()
    ]


def list_times() -> List[str]:
    """Return time coordinates from the real NetCDF dataset."""
    return netcdf_service.list_times()


def list_depths() -> List[float]:
    """Return depth coordinates from the real NetCDF dataset."""
    return netcdf_service.list_depths()


