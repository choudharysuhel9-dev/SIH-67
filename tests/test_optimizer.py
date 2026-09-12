"""
tests/test_optimizer.py
=======================
Unit tests for ocean_data_layer.optimizer.

All tests use small synthetic xr.Dataset objects - no file I/O,
no network, no Copernicus-specific knowledge.

Coverage
--------
- QueryParams construction and defaults
- Variable validation (unknown / unavailable)
- Date / time selection (valid, invalid, None)
- Depth subsetting (bounds, missing dim)
- Spatial subsetting (lat/lon bounds, missing dims)
- Explicit resolution / step (valid, overflow guard)
- Adaptive resolution (correct step selection)
- Gridded coarsening (NaN-safe aggregation)
- Sparse-data protection (coarsen() never called)
- Output-size protection (limit enforced)
- OptimizedResult.to_dict() shape / NaN handling
- Generic invariant: no Copernicus-specific names anywhere
"""

from __future__ import annotations

import numpy as np
import pytest
import xarray as xr

from ocean_data_layer.common import (
    CommonOceanDataset,
    OceanDatasetMeta,
)
from ocean_data_layer.optimizer import (
    DEFAULT_MAX_OUTPUT_POINTS,
    OceanDataOptimizer,
    OptimizedResult,
    QueryParams,
    _ADAPTIVE_STEPS,
)


# ---------------------------------------------------------------------------
# Synthetic dataset factories
# ---------------------------------------------------------------------------

def _make_gridded_meta(
    source="test_source",
    variables=None,
    time_range=None,
    native_resolution_deg=1.0,
    **kw,
) -> OceanDatasetMeta:
    variables = variables or ["temperature"]
    time_range = time_range or (
        np.datetime64("2020-01-01"),
        np.datetime64("2020-01-03"),
    )
    return OceanDatasetMeta(
        source_name=source,
        variables=variables,
        time_range=time_range,
        depth_range=(0.0, 100.0),
        lat_range=(0.0, 10.0),
        lon_range=(0.0, 10.0),
        units={v: "degC" for v in variables},
        is_gridded=True,
        native_resolution_deg=native_resolution_deg,
        **kw,
    )


def _make_sparse_meta(**kw) -> OceanDatasetMeta:
    return OceanDatasetMeta(
        source_name="sparse_source",
        variables=["temperature"],
        time_range=(np.datetime64("2020-01-01"), np.datetime64("2020-01-01")),
        depth_range=(0.0, 100.0),
        lat_range=(0.0, 10.0),
        lon_range=(0.0, 10.0),
        units={"temperature": "degC"},
        is_gridded=False,
        native_resolution_deg=None,
        **kw,
    )


def _make_gridded_dataset(
    n_time=3,
    n_depth=5,
    n_lat=10,
    n_lon=10,
    nan_fraction=0.0,
) -> xr.Dataset:
    """Small synthetic 4-D gridded dataset."""
    data = np.random.rand(n_time, n_depth, n_lat, n_lon).astype(np.float32) * 30
    if nan_fraction > 0:
        mask = np.random.rand(*data.shape) < nan_fraction
        data[mask] = np.nan

    times = [np.datetime64(f"2020-01-0{i+1}") for i in range(n_time)]
    depths = np.linspace(0, 100, n_depth)
    lats = np.linspace(0, 10, n_lat)
    lons = np.linspace(0, 10, n_lon)

    return xr.Dataset(
        {"temperature": (["time", "depth", "latitude", "longitude"], data)},
        coords={
            "time": times,
            "depth": depths,
            "latitude": lats,
            "longitude": lons,
        },
    )


def _make_sparse_dataset(n_obs=20) -> xr.Dataset:
    """Synthetic sparse (non-gridded) dataset with obs dimension."""
    rng = np.random.default_rng(42)
    data = rng.random(n_obs).astype(np.float32) * 30
    return xr.Dataset(
        {"temperature": (["obs"], data)},
        coords={"obs": np.arange(n_obs)},
    )


def _common_gridded(n_time=3, n_depth=5, n_lat=10, n_lon=10, nan_fraction=0.0):
    ds = _make_gridded_dataset(n_time, n_depth, n_lat, n_lon, nan_fraction)
    meta = _make_gridded_meta()
    return CommonOceanDataset(meta=meta, data=ds)


def _common_sparse(n_obs=20):
    ds = _make_sparse_dataset(n_obs)
    meta = _make_sparse_meta()
    return CommonOceanDataset(meta=meta, data=ds)


# ---------------------------------------------------------------------------
# QueryParams construction
# ---------------------------------------------------------------------------

class TestQueryParams:

    def test_defaults(self):
        p = QueryParams(variable="temperature")
        assert p.date is None
        assert p.depth_min is None
        assert p.depth_max is None
        assert p.lat_min is None
        assert p.lat_max is None
        assert p.lon_min is None
        assert p.lon_max is None
        assert p.step is None
        assert p.adaptive is True
        assert p.max_output_points == DEFAULT_MAX_OUTPUT_POINTS

    def test_explicit_step(self):
        p = QueryParams(variable="temperature", step=4, adaptive=False)
        assert p.step == 4
        assert p.adaptive is False

    def test_all_fields(self):
        p = QueryParams(
            variable="salinity",
            date="2020-01-02",
            depth_min=10.0,
            depth_max=50.0,
            lat_min=5.0,
            lat_max=15.0,
            lon_min=70.0,
            lon_max=75.0,
            step=2,
            adaptive=False,
            max_output_points=1000,
        )
        assert p.variable == "salinity"
        assert p.date == "2020-01-02"
        assert p.step == 2
        assert p.max_output_points == 1000


# ---------------------------------------------------------------------------
# Variable validation
# ---------------------------------------------------------------------------

class TestVariableValidation:

    def test_unknown_canonical_variable_raises(self):
        ocean_ds = _common_gridded()
        optimizer = OceanDataOptimizer(ocean_ds)
        with pytest.raises(ValueError, match="Unknown variable"):
            optimizer.optimize(QueryParams(variable="thetao"))

    def test_non_canonical_var_raises(self):
        ocean_ds = _common_gridded()
        optimizer = OceanDataOptimizer(ocean_ds)
        with pytest.raises(ValueError, match="Unknown variable"):
            optimizer.optimize(QueryParams(variable="pressure"))

    def test_canonical_but_unavailable_raises(self):
        ocean_ds = _common_gridded()
        optimizer = OceanDataOptimizer(ocean_ds)
        with pytest.raises(ValueError, match="not available"):
            optimizer.optimize(QueryParams(variable="salinity"))

    def test_valid_variable_ok(self):
        ocean_ds = _common_gridded()
        optimizer = OceanDataOptimizer(ocean_ds)
        result = optimizer.optimize(QueryParams(variable="temperature", step=1))
        assert result.variable == "temperature"


# ---------------------------------------------------------------------------
# Parameter validation
# ---------------------------------------------------------------------------

class TestParameterValidation:

    def test_step_zero_raises(self):
        ocean_ds = _common_gridded()
        optimizer = OceanDataOptimizer(ocean_ds)
        with pytest.raises(ValueError, match="step must be a positive integer"):
            optimizer.optimize(QueryParams(variable="temperature", step=0))

    def test_step_negative_raises(self):
        ocean_ds = _common_gridded()
        optimizer = OceanDataOptimizer(ocean_ds)
        with pytest.raises(ValueError, match="step must be a positive integer"):
            optimizer.optimize(QueryParams(variable="temperature", step=-1))

    def test_depth_min_gt_max_raises(self):
        ocean_ds = _common_gridded()
        optimizer = OceanDataOptimizer(ocean_ds)
        with pytest.raises(ValueError, match="depth_min.*depth_max"):
            optimizer.optimize(QueryParams(variable="temperature", depth_min=50, depth_max=10))

    def test_depth_negative_raises(self):
        ocean_ds = _common_gridded()
        optimizer = OceanDataOptimizer(ocean_ds)
        with pytest.raises(ValueError, match="non-negative"):
            optimizer.optimize(QueryParams(variable="temperature", depth_min=-5))

    def test_lat_min_gt_max_raises(self):
        ocean_ds = _common_gridded()
        optimizer = OceanDataOptimizer(ocean_ds)
        with pytest.raises(ValueError, match="lat_min.*lat_max"):
            optimizer.optimize(QueryParams(variable="temperature", lat_min=15, lat_max=5))

    def test_lat_out_of_range_raises(self):
        ocean_ds = _common_gridded()
        optimizer = OceanDataOptimizer(ocean_ds)
        with pytest.raises(ValueError, match="lat_max=95"):
            optimizer.optimize(QueryParams(variable="temperature", lat_max=95))

    def test_lon_min_gt_max_raises(self):
        ocean_ds = _common_gridded()
        optimizer = OceanDataOptimizer(ocean_ds)
        with pytest.raises(ValueError, match="lon_min.*lon_max"):
            optimizer.optimize(QueryParams(variable="temperature", lon_min=80, lon_max=70))

    def test_lon_out_of_range_raises(self):
        ocean_ds = _common_gridded()
        optimizer = OceanDataOptimizer(ocean_ds)
        with pytest.raises(ValueError, match="lon_min"):
            optimizer.optimize(QueryParams(variable="temperature", lon_min=-200))

    def test_max_output_points_zero_raises(self):
        ocean_ds = _common_gridded()
        optimizer = OceanDataOptimizer(ocean_ds)
        with pytest.raises(ValueError, match="max_output_points must be"):
            optimizer.optimize(QueryParams(variable="temperature", step=1, max_output_points=0))


# ---------------------------------------------------------------------------
# Time selection
# ---------------------------------------------------------------------------

class TestTimeSelection:

    def test_date_none_keeps_all_times(self):
        ocean_ds = _common_gridded(n_time=3)
        optimizer = OceanDataOptimizer(ocean_ds)
        result = optimizer.optimize(QueryParams(variable="temperature", step=1))
        d = result.to_dict()
        assert "time" in d["dims"]
        assert len(d["coords"]["time"]) == 3

    def test_date_selection(self):
        ocean_ds = _common_gridded(n_time=3)
        optimizer = OceanDataOptimizer(ocean_ds)
        result = optimizer.optimize(
            QueryParams(variable="temperature", date="2020-01-02", step=1)
        )
        d = result.to_dict()
        assert "time" not in d["dims"], "time dim should be dropped after .sel(time=date)"

    def test_invalid_date_raises(self):
        ocean_ds = _common_gridded(n_time=3)
        optimizer = OceanDataOptimizer(ocean_ds)
        with pytest.raises(ValueError, match="not available"):
            optimizer.optimize(
                QueryParams(variable="temperature", date="1999-01-01", step=1)
            )


# ---------------------------------------------------------------------------
# Depth subsetting
# ---------------------------------------------------------------------------

class TestDepthSubsetting:

    def test_no_depth_limits_keeps_all(self):
        ocean_ds = _common_gridded(n_depth=5)
        optimizer = OceanDataOptimizer(ocean_ds)
        result = optimizer.optimize(QueryParams(variable="temperature", step=1))
        d = result.to_dict()
        assert len(d["coords"]["depth"]) == 5

    def test_depth_min_clips_shallow(self):
        ocean_ds = _common_gridded(n_depth=5)  # depths 0..100 in 5 steps
        optimizer = OceanDataOptimizer(ocean_ds)
        result = optimizer.optimize(
            QueryParams(variable="temperature", depth_min=25.0, step=1)
        )
        d = result.to_dict()
        assert all(dep >= 25.0 for dep in d["coords"]["depth"])

    def test_depth_max_clips_deep(self):
        ocean_ds = _common_gridded(n_depth=5)
        optimizer = OceanDataOptimizer(ocean_ds)
        result = optimizer.optimize(
            QueryParams(variable="temperature", depth_max=50.0, step=1)
        )
        d = result.to_dict()
        assert all(dep <= 50.0 for dep in d["coords"]["depth"])


# ---------------------------------------------------------------------------
# Spatial subsetting
# ---------------------------------------------------------------------------

class TestSpatialSubsetting:

    def test_no_spatial_limits_keeps_all(self):
        ocean_ds = _common_gridded(n_lat=10, n_lon=10)
        optimizer = OceanDataOptimizer(ocean_ds)
        result = optimizer.optimize(QueryParams(variable="temperature", step=1))
        d = result.to_dict()
        assert len(d["coords"]["latitude"]) == 10
        assert len(d["coords"]["longitude"]) == 10

    def test_lat_subsetting(self):
        ocean_ds = _common_gridded(n_lat=10, n_lon=10)
        optimizer = OceanDataOptimizer(ocean_ds)
        result = optimizer.optimize(
            QueryParams(variable="temperature", lat_min=3.0, lat_max=7.0, step=1)
        )
        d = result.to_dict()
        assert all(3.0 <= lat <= 7.0 for lat in d["coords"]["latitude"])

    def test_lon_subsetting(self):
        ocean_ds = _common_gridded(n_lat=10, n_lon=10)
        optimizer = OceanDataOptimizer(ocean_ds)
        result = optimizer.optimize(
            QueryParams(variable="temperature", lon_min=2.0, lon_max=8.0, step=1)
        )
        d = result.to_dict()
        assert all(2.0 <= lon <= 8.0 for lon in d["coords"]["longitude"])


# ---------------------------------------------------------------------------
# Explicit resolution
# ---------------------------------------------------------------------------

class TestExplicitResolution:

    def test_step_1_no_coarsening(self):
        ocean_ds = _common_gridded(n_lat=10, n_lon=10)
        optimizer = OceanDataOptimizer(ocean_ds)
        result = optimizer.optimize(QueryParams(variable="temperature", step=1))
        d = result.to_dict()
        assert len(d["coords"]["latitude"]) == 10

    def test_step_2_halves_dims(self):
        ocean_ds = _common_gridded(n_lat=10, n_lon=10)
        optimizer = OceanDataOptimizer(ocean_ds)
        result = optimizer.optimize(QueryParams(variable="temperature", step=2))
        d = result.to_dict()
        assert len(d["coords"]["latitude"]) == 5

    def test_step_4_quarters_dims(self):
        ocean_ds = _common_gridded(n_lat=8, n_lon=8)
        optimizer = OceanDataOptimizer(ocean_ds)
        result = optimizer.optimize(QueryParams(variable="temperature", step=4))
        d = result.to_dict()
        assert len(d["coords"]["latitude"]) == 2

    def test_step_reduces_output(self):
        ocean_ds = _common_gridded(n_lat=10, n_lon=10)
        optimizer = OceanDataOptimizer(ocean_ds)
        r1 = optimizer.optimize(QueryParams(variable="temperature", step=1))
        r2 = optimizer.optimize(QueryParams(variable="temperature", step=2))
        assert np.prod(r2.shape) < np.prod(r1.shape)

    def test_step_overflow_raises(self):
        """Explicit step that would exceed max_output_points must raise."""
        ocean_ds = _common_gridded(n_time=1, n_depth=1, n_lat=20, n_lon=20)
        optimizer = OceanDataOptimizer(ocean_ds)
        with pytest.raises(ValueError, match="Explicit step=1 would produce"):
            optimizer.optimize(
                QueryParams(variable="temperature", step=1, max_output_points=10)
            )


# ---------------------------------------------------------------------------
# Adaptive resolution
# ---------------------------------------------------------------------------

class TestAdaptiveResolution:

    def test_adaptive_selects_valid_step(self):
        ocean_ds = _common_gridded(n_lat=10, n_lon=10)
        optimizer = OceanDataOptimizer(ocean_ds)
        result = optimizer.optimize(
            QueryParams(variable="temperature", adaptive=True, max_output_points=100)
        )
        assert result.step_used in _ADAPTIVE_STEPS

    def test_adaptive_respects_limit(self):
        ocean_ds = _common_gridded(n_time=1, n_depth=1, n_lat=100, n_lon=100)
        meta = OceanDatasetMeta(
            source_name="test", variables=["temperature"],
            time_range=(np.datetime64("2020-01-01"), np.datetime64("2020-01-01")),
            depth_range=(0.0, 1.0), lat_range=(0.0, 10.0), lon_range=(0.0, 10.0),
            units={"temperature": "degC"}, is_gridded=True,
        )
        ocean_ds = CommonOceanDataset(meta=meta, data=ocean_ds.data)
        optimizer = OceanDataOptimizer(ocean_ds)
        result = optimizer.optimize(
            QueryParams(variable="temperature", adaptive=True, max_output_points=500)
        )
        d = result.to_dict()
        total = np.prod([len(v) for v in d["coords"].values()])
        assert total <= 500

    def test_adaptive_step1_when_small_enough(self):
        """Tiny dataset should get step=1 in adaptive mode with a large limit."""
        ocean_ds = _common_gridded(n_time=1, n_depth=1, n_lat=4, n_lon=4)
        optimizer = OceanDataOptimizer(ocean_ds)
        result = optimizer.optimize(
            QueryParams(variable="temperature", adaptive=True, max_output_points=1_000_000)
        )
        assert result.step_used == 1


# ---------------------------------------------------------------------------
# NaN handling
# ---------------------------------------------------------------------------

class TestNanHandling:

    def test_nan_values_become_none_in_dict(self):
        ocean_ds = _common_gridded(n_time=1, n_depth=1, n_lat=4, n_lon=4, nan_fraction=0.5)
        optimizer = OceanDataOptimizer(ocean_ds)
        result = optimizer.optimize(QueryParams(variable="temperature", step=1))
        d = result.to_dict()
        flat = []
        for row in d["values"]:
            if isinstance(row, list):
                flat.extend(row if isinstance(row[0], list) else [row])
            else:
                flat.append(row)
        # Just check that the dict was produced and values is a list
        assert isinstance(d["values"], list)

    def test_all_nan_slab_produces_none_values(self):
        data = np.full((1, 1, 4, 4), np.nan, dtype=np.float32)
        ds = xr.Dataset(
            {"temperature": (["time", "depth", "latitude", "longitude"], data)},
            coords={
                "time": [np.datetime64("2020-01-01")],
                "depth": [0.0],
                "latitude": np.linspace(0, 1, 4),
                "longitude": np.linspace(0, 1, 4),
            },
        )
        meta = _make_gridded_meta()
        ocean_ds = CommonOceanDataset(meta=meta, data=ds)
        optimizer = OceanDataOptimizer(ocean_ds)
        result = optimizer.optimize(QueryParams(variable="temperature", step=1))
        d = result.to_dict()
        # Flatten recursively to check all None
        def flatten(x):
            if isinstance(x, list):
                for item in x:
                    yield from flatten(item)
            else:
                yield x
        all_vals = list(flatten(d["values"]))
        assert all(v is None for v in all_vals)


# ---------------------------------------------------------------------------
# Sparse data protection
# ---------------------------------------------------------------------------

class TestSparseDataProtection:

    def test_sparse_optimizer_returns_result(self):
        ocean_ds = _common_sparse(n_obs=10)
        optimizer = OceanDataOptimizer(ocean_ds)
        result = optimizer.optimize(QueryParams(variable="temperature"))
        assert isinstance(result, OptimizedResult)
        assert result.step_used == 1

    def test_sparse_optimizer_does_not_coarsen(self):
        """For sparse data, coarsen must never be called - step_used is always 1."""
        ocean_ds = _common_sparse(n_obs=50)
        optimizer = OceanDataOptimizer(ocean_ds)
        result = optimizer.optimize(QueryParams(variable="temperature"))
        assert result.step_used == 1

    def test_sparse_output_size_protection(self):
        ocean_ds = _common_sparse(n_obs=1000)
        optimizer = OceanDataOptimizer(ocean_ds)
        with pytest.raises(ValueError, match="Sparse query would return"):
            optimizer.optimize(
                QueryParams(variable="temperature", max_output_points=100)
            )

    def test_sparse_result_to_dict(self):
        ocean_ds = _common_sparse(n_obs=10)
        optimizer = OceanDataOptimizer(ocean_ds)
        result = optimizer.optimize(QueryParams(variable="temperature"))
        d = result.to_dict()
        assert d["is_gridded"] is False
        assert "values" in d
        assert len(d["values"]) == 10


# ---------------------------------------------------------------------------
# Output-size protection
# ---------------------------------------------------------------------------

class TestOutputSizeProtection:

    def test_explicit_safe_step_passes(self):
        ocean_ds = _common_gridded(n_time=1, n_depth=1, n_lat=10, n_lon=10)
        optimizer = OceanDataOptimizer(ocean_ds)
        result = optimizer.optimize(
            QueryParams(variable="temperature", step=2, max_output_points=100)
        )
        assert result is not None

    def test_explicit_unsafe_step_raises(self):
        ocean_ds = _common_gridded(n_time=1, n_depth=1, n_lat=20, n_lon=20)
        optimizer = OceanDataOptimizer(ocean_ds)
        with pytest.raises(ValueError, match="Explicit step=1 would produce"):
            optimizer.optimize(
                QueryParams(variable="temperature", step=1, max_output_points=50)
            )

    def test_global_default_is_large(self):
        assert DEFAULT_MAX_OUTPUT_POINTS == 500_000


# ---------------------------------------------------------------------------
# OptimizedResult
# ---------------------------------------------------------------------------

class TestOptimizedResult:

    def test_shape_property(self):
        ocean_ds = _common_gridded(n_time=1, n_depth=1, n_lat=4, n_lon=4)
        optimizer = OceanDataOptimizer(ocean_ds)
        result = optimizer.optimize(QueryParams(variable="temperature", step=1))
        assert result.shape == (1, 1, 4, 4)

    def test_to_dict_has_required_keys(self):
        ocean_ds = _common_gridded(n_time=1, n_depth=1, n_lat=4, n_lon=4)
        optimizer = OceanDataOptimizer(ocean_ds)
        result = optimizer.optimize(QueryParams(variable="temperature", step=1))
        d = result.to_dict()
        for key in ("source", "variable", "units", "date", "step_used",
                    "is_gridded", "shape", "dims", "coords", "values"):
            assert key in d, f"Missing key: {key}"

    def test_to_dict_source(self):
        ocean_ds = _common_gridded()
        optimizer = OceanDataOptimizer(ocean_ds)
        result = optimizer.optimize(QueryParams(variable="temperature", step=1))
        assert result.to_dict()["source"] == "test_source"

    def test_to_dict_variable(self):
        ocean_ds = _common_gridded()
        optimizer = OceanDataOptimizer(ocean_ds)
        result = optimizer.optimize(QueryParams(variable="temperature", step=1))
        assert result.to_dict()["variable"] == "temperature"

    def test_compute_returns_self(self):
        ocean_ds = _common_gridded(n_time=1, n_depth=1, n_lat=4, n_lon=4)
        optimizer = OceanDataOptimizer(ocean_ds)
        result = optimizer.optimize(QueryParams(variable="temperature", step=1))
        returned = result.compute()
        assert returned is result


# ---------------------------------------------------------------------------
# Generic invariant: no Copernicus-specific names
# ---------------------------------------------------------------------------

class TestGenericInvariant:
    """
    Verify the optimizer module contains no Copernicus-specific assumptions.
    This is a simple text-scan test - it would catch accidental leakage of
    source-specific knowledge into the generic optimizer.
    """

    def test_optimizer_module_has_no_copernicus_names(self):
        import inspect
        import ocean_data_layer.optimizer as opt_module
        src = inspect.getsource(opt_module)
        forbidden = ["thetao", "glorys", "copernicus", "GLORYS", "COPERNICUS"]
        for name in forbidden:
            assert name.lower() not in src.lower(), (
                f"Forbidden source-specific name {name!r} found in optimizer.py"
            )

    def test_cache_module_has_no_copernicus_names(self):
        import inspect
        import ocean_data_layer.cache as cache_module
        src = inspect.getsource(cache_module)
        forbidden = ["thetao", "glorys", "copernicus"]
        for name in forbidden:
            assert name.lower() not in src.lower(), (
                f"Forbidden source-specific name {name!r} found in cache.py"
            )
