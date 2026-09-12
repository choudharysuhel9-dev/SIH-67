"""
tests/test_common.py
====================
Unit tests for ocean_data_layer.common.

All tests are pure in-memory — no file I/O, no network access.
Synthetic xr.Dataset objects are used so the suite runs fast and
offline.
"""

import numpy as np
import pytest
import xarray as xr

from ocean_data_layer.common import (
    CANONICAL_COORDS,
    CANONICAL_VARIABLES,
    CommonOceanDataset,
    OceanDatasetMeta,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _minimal_meta(**overrides) -> OceanDatasetMeta:
    """Return a valid OceanDatasetMeta with sensible defaults."""
    defaults = dict(
        source_name="test_source",
        variables=["temperature"],
        time_range=(np.datetime64("2020-01-01"), np.datetime64("2020-01-03")),
        depth_range=(0.49, 92.33),
        lat_range=(10.0, 15.0),
        lon_range=(70.0, 75.0),
        units={"temperature": "degC"},
        is_gridded=True,
        native_resolution_deg=0.083,
        extra={"note": "test"},
    )
    defaults.update(overrides)
    return OceanDatasetMeta(**defaults)


def _minimal_gridded_dataset() -> xr.Dataset:
    """Return a tiny (1×1×2×2) xr.Dataset with canonical names."""
    data = np.array([[[[27.0, 27.1], [27.2, 27.3]]]], dtype=np.float32)
    return xr.Dataset(
        {"temperature": (["time", "depth", "latitude", "longitude"], data)},
        coords={
            "time":      [np.datetime64("2020-01-01")],
            "depth":     [0.49],
            "latitude":  [10.0, 10.083],
            "longitude": [70.0, 70.083],
        },
    )


# ---------------------------------------------------------------------------
# OceanDatasetMeta tests
# ---------------------------------------------------------------------------

class TestOceanDatasetMeta:

    def test_basic_construction(self):
        meta = _minimal_meta()
        assert meta.source_name == "test_source"
        assert meta.variables == ["temperature"]
        assert meta.is_gridded is True
        assert meta.native_resolution_deg == 0.083

    def test_gridded_false_is_valid(self):
        """is_gridded=False must be accepted without error.
        This documents the sparse-observation design hook.
        """
        meta = _minimal_meta(is_gridded=False, native_resolution_deg=None)
        assert meta.is_gridded is False
        assert meta.native_resolution_deg is None

    def test_extra_defaults_to_empty_dict(self):
        """extra field must default to {} so callers need not pass it."""
        meta = OceanDatasetMeta(
            source_name="s",
            variables=[],
            time_range=(np.datetime64("2020-01-01"), np.datetime64("2020-01-01")),
            depth_range=(0.0, 1.0),
            lat_range=(0.0, 1.0),
            lon_range=(0.0, 1.0),
            units={},
            is_gridded=True,
        )
        assert isinstance(meta.extra, dict)
        assert meta.extra == {}

    def test_extra_instances_are_independent(self):
        """Mutable default must not be shared across instances."""
        m1 = OceanDatasetMeta(
            source_name="a", variables=[], time_range=(np.datetime64("2020-01-01"),) * 2,
            depth_range=(0.0, 1.0), lat_range=(0.0, 1.0), lon_range=(0.0, 1.0),
            units={}, is_gridded=True,
        )
        m2 = OceanDatasetMeta(
            source_name="b", variables=[], time_range=(np.datetime64("2020-01-01"),) * 2,
            depth_range=(0.0, 1.0), lat_range=(0.0, 1.0), lon_range=(0.0, 1.0),
            units={}, is_gridded=True,
        )
        m1.extra["key"] = "value"
        assert "key" not in m2.extra, (
            "extra dicts must be independent instances (mutable default bug)"
        )

    def test_time_range_as_datetime64(self):
        meta = _minimal_meta()
        start, end = meta.time_range
        assert isinstance(start, np.datetime64)
        assert isinstance(end, np.datetime64)
        assert start <= end

    def test_depth_range_positive(self):
        meta = _minimal_meta(depth_range=(0.49, 92.33))
        assert meta.depth_range[0] >= 0
        assert meta.depth_range[1] >= meta.depth_range[0]

    def test_lat_range_within_bounds(self):
        meta = _minimal_meta(lat_range=(-90.0, 90.0))
        assert meta.lat_range[0] >= -90
        assert meta.lat_range[1] <= 90

    def test_lon_range_within_bounds(self):
        meta = _minimal_meta(lon_range=(-180.0, 360.0))
        assert meta.lon_range[0] >= -180
        assert meta.lon_range[1] <= 360

    def test_units_dict(self):
        meta = _minimal_meta(units={"temperature": "degC", "salinity": "PSU"})
        assert meta.units["temperature"] == "degC"
        assert meta.units["salinity"] == "PSU"


# ---------------------------------------------------------------------------
# CommonOceanDataset tests
# ---------------------------------------------------------------------------

class TestCommonOceanDataset:

    def test_wraps_xr_dataset_unchanged(self):
        """data field must store the xr.Dataset as-is."""
        ds = _minimal_gridded_dataset()
        meta = _minimal_meta()
        ocean_ds = CommonOceanDataset(meta=meta, data=ds)
        assert ocean_ds.data is ds

    def test_meta_is_stored(self):
        meta = _minimal_meta()
        ocean_ds = CommonOceanDataset(meta=meta, data=_minimal_gridded_dataset())
        assert ocean_ds.meta is meta

    def test_temperature_variable_accessible(self):
        ds = _minimal_gridded_dataset()
        ocean_ds = CommonOceanDataset(meta=_minimal_meta(), data=ds)
        assert "temperature" in ocean_ds.data

    def test_no_source_specific_variable_names(self):
        """The canonical dataset must not contain 'thetao'."""
        ds = _minimal_gridded_dataset()
        ocean_ds = CommonOceanDataset(meta=_minimal_meta(), data=ds)
        assert "thetao" not in ocean_ds.data

    def test_canonical_coord_names_present(self):
        ds = _minimal_gridded_dataset()
        ocean_ds = CommonOceanDataset(meta=_minimal_meta(), data=ds)
        for coord in ("time", "depth", "latitude", "longitude"):
            assert coord in ocean_ds.data.coords, (
                f"Expected canonical coordinate '{coord}' in dataset"
            )

    def test_no_non_canonical_dim_names(self):
        """No source-specific dim names (e.g. 'lat', 'lon') must appear."""
        ds = _minimal_gridded_dataset()
        ocean_ds = CommonOceanDataset(meta=_minimal_meta(), data=ds)
        non_canonical = set(ocean_ds.data.dims) - set(CANONICAL_COORDS)
        assert non_canonical == set(), (
            f"Non-canonical dimension names found: {non_canonical}"
        )


# ---------------------------------------------------------------------------
# Canonical registry tests
# These guard against accidental renames of the shared constants.
# ---------------------------------------------------------------------------

class TestCanonicalRegistries:

    def test_canonical_coords_contains_required_names(self):
        for name in ("time", "depth", "latitude", "longitude"):
            assert name in CANONICAL_COORDS, (
                f"'{name}' is missing from CANONICAL_COORDS"
            )

    def test_canonical_variables_contains_required_names(self):
        for name in ("temperature", "salinity", "u_velocity", "v_velocity", "ssh"):
            assert name in CANONICAL_VARIABLES, (
                f"'{name}' is missing from CANONICAL_VARIABLES"
            )

    def test_canonical_variables_maps_to_unit_strings(self):
        for var, unit in CANONICAL_VARIABLES.items():
            assert isinstance(unit, str) and unit, (
                f"CANONICAL_VARIABLES['{var}'] must be a non-empty string"
            )

    def test_temperature_unit_is_degC(self):
        assert CANONICAL_VARIABLES["temperature"] == "degC"

    def test_salinity_unit_is_PSU(self):
        assert CANONICAL_VARIABLES["salinity"] == "PSU"
