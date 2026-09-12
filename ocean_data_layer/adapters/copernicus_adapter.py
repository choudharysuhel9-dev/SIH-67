"""
ocean_data_layer.adapters.copernicus_adapter
============================================
Adapter for Copernicus Marine Service GLORYS12V1-style NetCDF files.

This is the ONLY file in the entire ocean_data_layer package that is
allowed to know about:
  - The Copernicus variable name ``thetao``
  - GLORYS12V1-specific dimension/coordinate names
  - The GLORYS12V1 native resolution (0.083°)
  - Dask chunk sizes tuned for the GLORYS12V1 file layout

Everything Copernicus-specific lives here and nowhere else.

Usage
-----
    from ocean_data_layer.adapters.copernicus_adapter import (
        CopernicusNetCDFAdapter,
    )

    adapter = CopernicusNetCDFAdapter()
    dataset = adapter.load(file_path="path/to/glorys12v1.nc")

    # dataset.data["temperature"] — canonical variable, Dask-backed
    # dataset.meta.source_name   — "copernicus_glorys12v1"
    # dataset.meta.is_gridded    — True
"""

from __future__ import annotations

import os

import numpy as np
import xarray as xr

from ocean_data_layer.adapters.base_adapter import BaseOceanAdapter
from ocean_data_layer.common import CommonOceanDataset, OceanDatasetMeta


# ---------------------------------------------------------------------------
# GLORYS12V1-specific constants
# Centralised here so they are easy to audit, update, or override in tests.
# ---------------------------------------------------------------------------

#: Dask chunk sizes tuned for the GLORYS12V1 file layout.
#: These match the values that were proven to work in the prototype
#: (optimizer.py __init__) and dask_test.py.
GLORYS12_CHUNKS: dict[str, int] = {
    "time":      1,
    "depth":     5,
    "latitude":  30,
    "longitude": 30,
}

#: Maps Copernicus source variable names → canonical variable names.
#: Only variables present in the file will be renamed; others are silently
#: skipped.  Commented-out entries are intentional documentation of
#: future mappings — do NOT implement them until real data/code exists.
COPERNICUS_VAR_MAP: dict[str, str] = {
    "thetao": "temperature",
    # "so":     "salinity",    # practical salinity — add when needed
    # "uo":     "u_velocity",  # eastward velocity  — add when needed
    # "vo":     "v_velocity",  # northward velocity — add when needed
    # "zos":    "ssh",         # sea surface height — add when needed
}

#: Published native horizontal resolution of the GLORYS12V1 model grid.
GLORYS12_RESOLUTION_DEG: float = 0.083

#: Canonical source identifier — must never change once deployed.
GLORYS12_SOURCE_NAME: str = "copernicus_glorys12v1"

#: GLORYS12V1 already uses these dimension names; listed explicitly so
#: any future file that differs will be caught by the adapter.
EXPECTED_DIMS: frozenset[str] = frozenset(
    {"time", "depth", "latitude", "longitude"}
)


# ---------------------------------------------------------------------------
# CopernicusNetCDFAdapter
# ---------------------------------------------------------------------------

class CopernicusNetCDFAdapter(BaseOceanAdapter):
    """
    Adapter for Copernicus GLORYS12V1-style NetCDF files.

    Produces a ``CommonOceanDataset`` with:
      - Canonical coordinate names (time, depth, latitude, longitude)
      - Canonical variable name(s) (thetao → temperature, etc.)
      - ``is_gridded = True``
      - Dask-backed (lazy) arrays — ``.load()`` is NOT called

    Parameters
    ----------
    chunks : dict, optional
        Override the default Dask chunk sizes for testing or performance
        tuning.  Defaults to ``GLORYS12_CHUNKS``.
    """

    def __init__(
        self,
        chunks: dict[str, int] | None = None,
    ) -> None:
        self._chunks = chunks if chunks is not None else GLORYS12_CHUNKS

    # ------------------------------------------------------------------
    # BaseOceanAdapter interface
    # ------------------------------------------------------------------

    @property
    def source_name(self) -> str:
        return GLORYS12_SOURCE_NAME

    def load(self, *, file_path: str) -> CommonOceanDataset:
        """
        Open a GLORYS12V1 NetCDF file and return a ``CommonOceanDataset``.

        Parameters
        ----------
        file_path : str
            Absolute or relative path to the ``.nc`` file.
            Must be provided as a keyword argument.

        Returns
        -------
        CommonOceanDataset
            - ``data`` is an ``xr.Dataset`` with Dask-backed arrays.
            - All variable names are canonical (``thetao`` → ``temperature``).
            - All dimension/coordinate names are canonical.
            - ``.load()`` has NOT been called.

        Raises
        ------
        FileNotFoundError
            If ``file_path`` does not point to an existing file.
        ValueError
            If the file is missing all expected Copernicus variables,
            or if the file's dimension names are not the expected set.
        """

        # ---------------------------------------------------------------
        # 1. Validate file existence before xarray tries to open it
        # ---------------------------------------------------------------
        if not os.path.isfile(file_path):
            raise FileNotFoundError(
                f"CopernicusNetCDFAdapter: file not found: {file_path!r}"
            )

        # ---------------------------------------------------------------
        # 2. Open with Dask — lazy, no computation yet
        # ---------------------------------------------------------------
        ds = xr.open_dataset(file_path, chunks=self._chunks)

        # ---------------------------------------------------------------
        # 3. Validate dimension names
        # GLORYS12V1 already uses the canonical names; this check ensures
        # a differently-formatted Copernicus file is caught early rather
        # than producing silently wrong output downstream.
        # ---------------------------------------------------------------
        actual_dims = frozenset(ds.dims)
        missing_dims = EXPECTED_DIMS - actual_dims
        if missing_dims:
            raise ValueError(
                f"CopernicusNetCDFAdapter: expected dimensions "
                f"{sorted(EXPECTED_DIMS)} but the file is missing "
                f"{sorted(missing_dims)}.  "
                f"File dimensions found: {sorted(actual_dims)}"
            )

        # ---------------------------------------------------------------
        # 4. Rename Copernicus variables → canonical names
        # Only rename variables that are actually present in the file.
        # ---------------------------------------------------------------
        rename_map = {
            src: dst
            for src, dst in COPERNICUS_VAR_MAP.items()
            if src in ds
        }
        if not rename_map:
            raise ValueError(
                f"CopernicusNetCDFAdapter: none of the expected Copernicus "
                f"variables {list(COPERNICUS_VAR_MAP.keys())} were found in "
                f"{file_path!r}.  Variables present: {list(ds.data_vars)}"
            )

        ds = ds.rename(rename_map)

        # ---------------------------------------------------------------
        # 5. Build metadata
        # ---------------------------------------------------------------
        canonical_vars_present = [
            canonical
            for canonical in rename_map.values()
            if canonical in ds
        ]

        units: dict[str, str] = {}
        for var_name in canonical_vars_present:
            raw_units = ds[var_name].attrs.get("units", None)
            if raw_units is not None:
                units[var_name] = str(raw_units)
            else:
                # Fall back to the canonical default unit
                from ocean_data_layer.common import CANONICAL_VARIABLES
                units[var_name] = CANONICAL_VARIABLES.get(var_name, "unknown")

        meta = OceanDatasetMeta(
            source_name=self.source_name,
            variables=canonical_vars_present,
            time_range=(
                ds["time"].values[0],
                ds["time"].values[-1],
            ),
            depth_range=(
                float(np.min(ds["depth"].values)),
                float(np.max(ds["depth"].values)),
            ),
            lat_range=(
                float(np.min(ds["latitude"].values)),
                float(np.max(ds["latitude"].values)),
            ),
            lon_range=(
                float(np.min(ds["longitude"].values)),
                float(np.max(ds["longitude"].values)),
            ),
            units=units,
            is_gridded=True,
            native_resolution_deg=GLORYS12_RESOLUTION_DEG,
            extra={
                "original_source": (
                    "Copernicus Marine Service — "
                    "Global Ocean Physics Reanalysis GLORYS12V1"
                ),
                "file_path": os.path.abspath(file_path),
            },
        )

        return CommonOceanDataset(meta=meta, data=ds)
