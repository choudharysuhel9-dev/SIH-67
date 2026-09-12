"""
tests/test_copernicus_adapter.py
=================================
Integration tests for CopernicusNetCDFAdapter.

These tests require the real Copernicus test NetCDF file.
The file path is resolved in this order:
  1. Environment variable OCEAN_TEST_FILE (allows CI to override)
  2. Hard-coded default filename (the file known to be in the workspace)

Tests do NOT call .load() / .compute() on Dask arrays — they only
verify metadata and dataset structure, so they run fast even against
the real file.
"""

from __future__ import annotations

import os

import numpy as np
import pytest
import xarray as xr

from ocean_data_layer.adapters.copernicus_adapter import (
    COPERNICUS_VAR_MAP,
    EXPECTED_DIMS,
    GLORYS12_RESOLUTION_DEG,
    GLORYS12_SOURCE_NAME,
    CopernicusNetCDFAdapter,
)
from ocean_data_layer.common import (
    CANONICAL_COORDS,
    CommonOceanDataset,
    OceanDatasetMeta,
)


# ---------------------------------------------------------------------------
# Test-file path resolution
# ---------------------------------------------------------------------------

_DEFAULT_TEST_FILE = (
    "cmems_mod_glo_phy_my_0.083deg_P1D-m_thetao_"
    "70.00E-75.00E_10.00N-15.00N_0.49-92.33m_"
    "2020-01-01-2020-01-03.nc"
)

TEST_FILE: str = os.environ.get("OCEAN_TEST_FILE", _DEFAULT_TEST_FILE)

_file_missing = not os.path.isfile(TEST_FILE)

requires_test_file = pytest.mark.skipif(
    _file_missing,
    reason=f"Copernicus test file not found: {TEST_FILE!r}. "
           f"Set OCEAN_TEST_FILE env var to override.",
)


# ---------------------------------------------------------------------------
# Adapter instantiation tests (no file needed)
# ---------------------------------------------------------------------------

class TestAdapterInstantiation:

    def test_source_name(self):
        adapter = CopernicusNetCDFAdapter()
        assert adapter.source_name == GLORYS12_SOURCE_NAME
        assert adapter.source_name == "copernicus_glorys12v1"

    def test_load_requires_keyword_argument(self):
        """load() must reject positional file_path — enforces keyword-only."""
        adapter = CopernicusNetCDFAdapter()
        with pytest.raises(TypeError):
            adapter.load(TEST_FILE)  # positional — must fail

    def test_load_raises_file_not_found(self):
        adapter = CopernicusNetCDFAdapter()
        with pytest.raises(FileNotFoundError, match="file not found"):
            adapter.load(file_path="nonexistent_file_xyz.nc")

    def test_custom_chunks_accepted(self):
        """Custom chunk sizes must be stored without error."""
        custom = {"time": 2, "depth": 10, "latitude": 15, "longitude": 15}
        adapter = CopernicusNetCDFAdapter(chunks=custom)
        assert adapter._chunks == custom

    def test_default_chunks_are_glorys12(self):
        from ocean_data_layer.adapters.copernicus_adapter import GLORYS12_CHUNKS
        adapter = CopernicusNetCDFAdapter()
        assert adapter._chunks == GLORYS12_CHUNKS


# ---------------------------------------------------------------------------
# Tests against the real test file
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def loaded_dataset() -> CommonOceanDataset:
    """Load the Copernicus test file once for all tests in this module."""
    adapter = CopernicusNetCDFAdapter()
    return adapter.load(file_path=TEST_FILE)


@requires_test_file
class TestLoadReturnsCorrectTypes:

    def test_returns_common_ocean_dataset(self, loaded_dataset):
        assert isinstance(loaded_dataset, CommonOceanDataset)

    def test_data_is_xr_dataset(self, loaded_dataset):
        assert isinstance(loaded_dataset.data, xr.Dataset)

    def test_meta_is_ocean_dataset_meta(self, loaded_dataset):
        assert isinstance(loaded_dataset.meta, OceanDatasetMeta)


@requires_test_file
class TestVariableRenaming:

    def test_thetao_not_in_dataset(self, loaded_dataset):
        """thetao must not leak out of the adapter."""
        assert "thetao" not in loaded_dataset.data, (
            "'thetao' must be renamed to 'temperature' by the adapter"
        )

    def test_temperature_in_dataset(self, loaded_dataset):
        assert "temperature" in loaded_dataset.data, (
            "'temperature' must be present after renaming 'thetao'"
        )

    def test_no_unmapped_copernicus_vars_remain(self, loaded_dataset):
        """None of the source-side keys in COPERNICUS_VAR_MAP may survive."""
        for src_name in COPERNICUS_VAR_MAP:
            assert src_name not in loaded_dataset.data, (
                f"Source variable '{src_name}' must have been renamed "
                f"or was not present — it must not appear in the output dataset"
            )


@requires_test_file
class TestDimensionNames:

    def test_canonical_dims_present(self, loaded_dataset):
        for dim in CANONICAL_COORDS:
            assert dim in loaded_dataset.data.dims, (
                f"Canonical dimension '{dim}' missing from dataset"
            )

    def test_no_non_canonical_dims(self, loaded_dataset):
        non_canonical = set(loaded_dataset.data.dims) - set(CANONICAL_COORDS)
        assert non_canonical == set(), (
            f"Non-canonical dimension names found: {non_canonical}"
        )

    def test_all_expected_dims_present(self, loaded_dataset):
        """All four spatial/temporal dimensions must be present."""
        assert EXPECTED_DIMS.issubset(set(loaded_dataset.data.dims))


@requires_test_file
class TestMetadataFields:

    def test_source_name(self, loaded_dataset):
        assert loaded_dataset.meta.source_name == "copernicus_glorys12v1"

    def test_is_gridded_true(self, loaded_dataset):
        assert loaded_dataset.meta.is_gridded is True

    def test_native_resolution(self, loaded_dataset):
        assert loaded_dataset.meta.native_resolution_deg == GLORYS12_RESOLUTION_DEG
        assert loaded_dataset.meta.native_resolution_deg == 0.083

    def test_variables_list_contains_temperature(self, loaded_dataset):
        assert "temperature" in loaded_dataset.meta.variables

    def test_variables_list_no_source_names(self, loaded_dataset):
        for src_name in COPERNICUS_VAR_MAP:
            assert src_name not in loaded_dataset.meta.variables

    def test_time_range_is_tuple_of_datetime64(self, loaded_dataset):
        start, end = loaded_dataset.meta.time_range
        assert isinstance(start, np.datetime64), "time_range[0] must be np.datetime64"
        assert isinstance(end, np.datetime64), "time_range[1] must be np.datetime64"
        assert start <= end, "time_range start must be <= end"

    def test_depth_range_positive_floats(self, loaded_dataset):
        d_min, d_max = loaded_dataset.meta.depth_range
        assert isinstance(d_min, float)
        assert isinstance(d_max, float)
        assert d_min >= 0.0, "Shallowest depth must be non-negative"
        assert d_max >= d_min, "Deepest depth must be >= shallowest"

    def test_lat_range_within_global_bounds(self, loaded_dataset):
        lat_min, lat_max = loaded_dataset.meta.lat_range
        assert -90 <= lat_min <= 90, f"lat_min={lat_min} out of range"
        assert -90 <= lat_max <= 90, f"lat_max={lat_max} out of range"
        assert lat_min <= lat_max

    def test_lon_range_within_global_bounds(self, loaded_dataset):
        lon_min, lon_max = loaded_dataset.meta.lon_range
        assert -180 <= lon_min <= 360, f"lon_min={lon_min} out of range"
        assert -180 <= lon_max <= 360, f"lon_max={lon_max} out of range"
        assert lon_min <= lon_max

    def test_units_temperature_is_non_empty_string(self, loaded_dataset):
        units = loaded_dataset.meta.units
        assert "temperature" in units, "units dict must contain 'temperature'"
        assert isinstance(units["temperature"], str)
        assert units["temperature"], "temperature unit string must not be empty"

    def test_extra_contains_original_source(self, loaded_dataset):
        assert "original_source" in loaded_dataset.meta.extra
        assert "GLORYS12V1" in loaded_dataset.meta.extra["original_source"]

    def test_extra_contains_file_path(self, loaded_dataset):
        assert "file_path" in loaded_dataset.meta.extra
        assert os.path.isabs(loaded_dataset.meta.extra["file_path"])


@requires_test_file
class TestDaskBacking:

    def test_temperature_is_dask_backed(self, loaded_dataset):
        """
        The adapter must NOT call .load() / .compute().
        The returned arrays must still be lazy Dask arrays.
        """
        da = loaded_dataset.data["temperature"]
        assert da.chunks is not None, (
            "temperature DataArray must be Dask-backed (lazy). "
            "The adapter must not call .load() or .compute()."
        )

    def test_dataset_is_not_fully_loaded(self, loaded_dataset):
        """Verify at least one variable has Dask chunks (lazy)."""
        has_dask = any(
            v.chunks is not None
            for v in loaded_dataset.data.data_vars.values()
        )
        assert has_dask, "At least one variable must be Dask-backed"


@requires_test_file
class TestDataShape:

    def test_time_dimension_has_values(self, loaded_dataset):
        assert loaded_dataset.data.sizes["time"] > 0

    def test_depth_dimension_has_values(self, loaded_dataset):
        assert loaded_dataset.data.sizes["depth"] > 0

    def test_lat_lon_dimensions_have_values(self, loaded_dataset):
        assert loaded_dataset.data.sizes["latitude"] > 0
        assert loaded_dataset.data.sizes["longitude"] > 0

    def test_known_glorys12v1_shape(self, loaded_dataset):
        """
        Smoke-check: the test file is known to have shape (3, 22, 61, 61).
        If this test fails, the file may have been replaced with a different
        test dataset — update this assertion accordingly.
        """
        ds = loaded_dataset.data
        assert ds.sizes["time"] == 3,      f"Expected time=3,  got {ds.sizes['time']}"
        assert ds.sizes["depth"] == 22,    f"Expected depth=22, got {ds.sizes['depth']}"
        assert ds.sizes["latitude"] == 61, f"Expected lat=61,   got {ds.sizes['latitude']}"
        assert ds.sizes["longitude"] == 61, f"Expected lon=61,  got {ds.sizes['longitude']}"
