"""
ocean_data_layer.common
=======================
Shared data contracts for the Ocean Data Optimization Layer.

This module is the single source of truth for ALL inter-team data
representations.  It has no I/O, no xarray operations, and no
source-specific logic.  Every adapter produces these types; the
Phase 2 optimizer and the Member 3 API both consume them.

Canonical coordinate names (all adapters MUST rename to these)
--------------------------------------------------------------
  time        — np.datetime64
  depth       — metres, positive downward
  latitude    — degrees North
  longitude   — degrees East

Canonical variable names (all adapters MUST rename to these)
------------------------------------------------------------
  temperature   — °C   (potential / sea temperature)
  salinity      — PSU  (practical salinity)
  u_velocity    — m/s  (eastward)
  v_velocity    — m/s  (northward)
  ssh           — m    (sea surface height anomaly)
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

import xarray as xr


# ---------------------------------------------------------------------------
# Canonical name registries
# Used by tests to guard against silent renames across the codebase.
# ---------------------------------------------------------------------------

#: Ordered tuple of canonical coordinate dimension names.
CANONICAL_COORDS: tuple[str, ...] = ("time", "depth", "latitude", "longitude")

#: Mapping of canonical variable name → standard SI/oceanographic unit string.
CANONICAL_VARIABLES: dict[str, str] = {
    "temperature": "degC",
    "salinity":    "PSU",
    "u_velocity":  "m/s",
    "v_velocity":  "m/s",
    "ssh":         "m",
}


# ---------------------------------------------------------------------------
# OceanDatasetMeta
# ---------------------------------------------------------------------------

@dataclass
class OceanDatasetMeta:
    """
    Source-agnostic metadata describing a loaded ocean dataset.

    Every adapter is responsible for populating all fields before
    returning a CommonOceanDataset.  The Phase 2 optimizer reads
    this metadata to decide which operations are valid — for example,
    it must NOT apply coarsen() when is_gridded=False.

    Parameters
    ----------
    source_name:
        Human-readable, machine-stable identifier for the data source.
        Use snake_case, e.g. ``"copernicus_glorys12v1"``.
        This value appears in API responses so that the frontend can
        display the correct source label.

    variables:
        List of canonical variable names present in the dataset,
        e.g. ``["temperature"]``.  Names must come from CANONICAL_VARIABLES.

    time_range:
        (first_timestamp, last_timestamp) as np.datetime64 values.
        Represents the temporal coverage of the loaded data.

    depth_range:
        (shallowest_depth_m, deepest_depth_m) as floats.
        Both values are positive (depth is positive downward).

    lat_range:
        (southernmost_lat, northernmost_lat) in degrees North.

    lon_range:
        (westernmost_lon, easternmost_lon) in degrees East.

    units:
        Dict mapping canonical variable name → unit string as it appears
        in the source file (or the canonical default if absent).
        e.g. ``{"temperature": "degC"}``.

    is_gridded:
        True  — data is on a regular 4-D (time × depth × lat × lon) grid.
                Copernicus GLORYS12V1 is the primary example.
                The Phase 2 optimizer may apply coarsen() and spatial slices.

        False — data consists of irregular / sparse point observations
                (e.g. Argo floats, gliders).
                The Phase 2 optimizer MUST NOT apply gridded operations.
                Binning or interpolation onto a grid is explicitly deferred
                and is NOT handled by Phase 1 or Phase 2 of this package.

        This flag is the explicit design hook for future sparse sources
        without committing to a grid-interpolation strategy now.

    native_resolution_deg:
        Approximate grid spacing in degrees for gridded sources,
        or None for sparse / irregular sources.
        e.g. 0.083 for GLORYS12V1.

    extra:
        Catch-all dict for source-specific extras that do not fit the
        standard fields above (e.g. model version, institution, DOI).
        The optimizer and API layer treat this as opaque pass-through data.
    """

    source_name: str
    variables: list[str]
    time_range: tuple
    depth_range: tuple[float, float]
    lat_range: tuple[float, float]
    lon_range: tuple[float, float]
    units: dict[str, str]
    is_gridded: bool
    native_resolution_deg: Optional[float] = None
    extra: dict = field(default_factory=dict)


# ---------------------------------------------------------------------------
# CommonOceanDataset
# ---------------------------------------------------------------------------

@dataclass
class CommonOceanDataset:
    """
    The standard contract that every adapter must produce.

    This is the only representation the Phase 2 optimizer and the
    Member 3 API need to know about.  They must never inspect
    source-specific variable or dimension names.

    Fields
    ------
    meta:
        An OceanDatasetMeta instance fully populated by the adapter.

    data:
        An xr.Dataset whose coordinate names and variable names
        ALL conform to the canonical naming tables in this module.

        When is_gridded=True:
            data has dimensions (time, depth, latitude, longitude).
            Variables are dense arrays (possibly Dask-backed and lazy).

        When is_gridded=False (future sparse sources):
            data dimensions are source-dependent (e.g. obs, profile).
            The optimizer must check meta.is_gridded before any
            gridded operation.  No sparse handling is implemented yet.

    Invariants enforced by the adapter (not re-checked here):
        - Every dim in data.dims is a member of CANONICAL_COORDS.
        - Every data variable name is a key in CANONICAL_VARIABLES.
        - The dataset is Dask-backed (lazy); .load() has NOT been called.
    """

    meta: OceanDatasetMeta
    data: xr.Dataset
