"""
tests/test_cache.py
===================
Unit tests for ocean_data_layer.cache.

Coverage
--------
- Cache construction (valid / invalid max_size)
- Cache hit / miss behaviour
- Cache key correctness (every parameter included)
- LRU eviction when max_size is reached
- Cache boundedness (size never exceeds max_size)
- invalidate() removes a specific key
- clear() empties the cache
- repr / len / properties
"""

from __future__ import annotations

import pytest

from ocean_data_layer.cache import OptimizerCache, make_cache_key


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _default_key(**overrides) -> tuple:
    defaults = dict(
        source="test_source",
        variable="temperature",
        date="2020-01-01",
        depth_min=0.0,
        depth_max=100.0,
        lat_min=0.0,
        lat_max=10.0,
        lon_min=0.0,
        lon_max=10.0,
        step=2,
        adaptive=False,
        max_output_points=500_000,
    )
    defaults.update(overrides)
    return make_cache_key(**defaults)


# ---------------------------------------------------------------------------
# Construction
# ---------------------------------------------------------------------------

class TestCacheConstruction:

    def test_default_max_size(self):
        cache = OptimizerCache()
        from ocean_data_layer.cache import DEFAULT_CACHE_MAX_SIZE
        assert cache.max_size == DEFAULT_CACHE_MAX_SIZE

    def test_custom_max_size(self):
        cache = OptimizerCache(max_size=16)
        assert cache.max_size == 16

    def test_max_size_zero_raises(self):
        with pytest.raises(ValueError, match="max_size must be"):
            OptimizerCache(max_size=0)

    def test_max_size_negative_raises(self):
        with pytest.raises(ValueError, match="max_size must be"):
            OptimizerCache(max_size=-1)

    def test_starts_empty(self):
        cache = OptimizerCache(max_size=4)
        assert len(cache) == 0
        assert cache.size == 0


# ---------------------------------------------------------------------------
# Hit / miss
# ---------------------------------------------------------------------------

class TestHitMiss:

    def test_miss_on_empty(self):
        cache = OptimizerCache()
        key = _default_key()
        assert not cache.has(key)

    def test_get_on_miss_raises_key_error(self):
        cache = OptimizerCache()
        key = _default_key()
        with pytest.raises(KeyError):
            cache.get(key)

    def test_put_then_has(self):
        cache = OptimizerCache()
        key = _default_key()
        cache.put(key, "result_a")
        assert cache.has(key)

    def test_put_then_get(self):
        cache = OptimizerCache()
        key = _default_key()
        cache.put(key, {"data": [1, 2, 3]})
        assert cache.get(key) == {"data": [1, 2, 3]}

    def test_two_different_keys(self):
        cache = OptimizerCache()
        k1 = _default_key(date="2020-01-01")
        k2 = _default_key(date="2020-01-02")
        cache.put(k1, "a")
        cache.put(k2, "b")
        assert cache.get(k1) == "a"
        assert cache.get(k2) == "b"

    def test_overwrite_existing_key(self):
        cache = OptimizerCache()
        key = _default_key()
        cache.put(key, "first")
        cache.put(key, "second")
        assert cache.get(key) == "second"
        assert cache.size == 1


# ---------------------------------------------------------------------------
# Cache key correctness
# ---------------------------------------------------------------------------

class TestCacheKeyCorrectness:
    """Every parameter that can change the output must produce a different key."""

    def _keys_differ(self, **override) -> bool:
        base = _default_key()
        modified = _default_key(**override)
        return base != modified

    def test_different_source(self):
        assert self._keys_differ(source="other_source")

    def test_different_variable(self):
        assert self._keys_differ(variable="salinity")

    def test_different_date(self):
        assert self._keys_differ(date="2020-01-02")

    def test_date_none_vs_string(self):
        assert self._keys_differ(date=None)

    def test_different_depth_min(self):
        assert self._keys_differ(depth_min=10.0)

    def test_different_depth_max(self):
        assert self._keys_differ(depth_max=50.0)

    def test_different_lat_min(self):
        assert self._keys_differ(lat_min=1.0)

    def test_different_lat_max(self):
        assert self._keys_differ(lat_max=9.0)

    def test_different_lon_min(self):
        assert self._keys_differ(lon_min=1.0)

    def test_different_lon_max(self):
        assert self._keys_differ(lon_max=9.0)

    def test_different_step(self):
        assert self._keys_differ(step=4)

    def test_step_none_vs_int(self):
        assert self._keys_differ(step=None)

    def test_different_adaptive(self):
        assert self._keys_differ(adaptive=True)

    def test_different_max_output_points(self):
        assert self._keys_differ(max_output_points=1000)

    def test_int_and_float_normalised(self):
        """int 0 and float 0.0 should produce the same key."""
        k_int = make_cache_key(
            source="s", variable="temperature", date="2020-01-01",
            depth_min=0, depth_max=100,
            lat_min=0, lat_max=10,
            lon_min=0, lon_max=10,
            step=2, adaptive=False, max_output_points=500_000,
        )
        k_float = make_cache_key(
            source="s", variable="temperature", date="2020-01-01",
            depth_min=0.0, depth_max=100.0,
            lat_min=0.0, lat_max=10.0,
            lon_min=0.0, lon_max=10.0,
            step=2, adaptive=False, max_output_points=500_000,
        )
        assert k_int == k_float


# ---------------------------------------------------------------------------
# LRU eviction and boundedness
# ---------------------------------------------------------------------------

class TestLRUEviction:

    def test_size_never_exceeds_max(self):
        cache = OptimizerCache(max_size=3)
        for i in range(10):
            key = _default_key(date=f"2020-01-{i+1:02d}")
            cache.put(key, i)
        assert cache.size <= 3

    def test_lru_entry_evicted_first(self):
        cache = OptimizerCache(max_size=3)
        k1 = _default_key(date="2020-01-01")
        k2 = _default_key(date="2020-01-02")
        k3 = _default_key(date="2020-01-03")
        k4 = _default_key(date="2020-01-04")

        cache.put(k1, 1)
        cache.put(k2, 2)
        cache.put(k3, 3)
        # k1 is LRU - adding k4 should evict k1
        cache.put(k4, 4)
        assert not cache.has(k1), "LRU entry (k1) should have been evicted"
        assert cache.has(k2)
        assert cache.has(k3)
        assert cache.has(k4)

    def test_access_promotes_lru(self):
        cache = OptimizerCache(max_size=3)
        k1 = _default_key(date="2020-01-01")
        k2 = _default_key(date="2020-01-02")
        k3 = _default_key(date="2020-01-03")
        k4 = _default_key(date="2020-01-04")

        cache.put(k1, 1)
        cache.put(k2, 2)
        cache.put(k3, 3)
        # Access k1 - it is now MRU; k2 becomes LRU
        cache.get(k1)
        # Adding k4 should evict k2 (now LRU)
        cache.put(k4, 4)
        assert cache.has(k1), "k1 should NOT be evicted (it was recently accessed)"
        assert not cache.has(k2), "k2 (LRU) should have been evicted"

    def test_max_size_one(self):
        cache = OptimizerCache(max_size=1)
        k1 = _default_key(date="2020-01-01")
        k2 = _default_key(date="2020-01-02")
        cache.put(k1, "a")
        cache.put(k2, "b")
        assert cache.size == 1
        assert cache.has(k2)
        assert not cache.has(k1)


# ---------------------------------------------------------------------------
# Invalidate / clear
# ---------------------------------------------------------------------------

class TestInvalidateClear:

    def test_invalidate_removes_key(self):
        cache = OptimizerCache()
        key = _default_key()
        cache.put(key, "x")
        result = cache.invalidate(key)
        assert result is True
        assert not cache.has(key)

    def test_invalidate_missing_key_returns_false(self):
        cache = OptimizerCache()
        key = _default_key()
        result = cache.invalidate(key)
        assert result is False

    def test_clear_empties_cache(self):
        cache = OptimizerCache()
        for i in range(5):
            key = _default_key(date=f"2020-01-{i+1:02d}")
            cache.put(key, i)
        assert cache.size == 5
        cache.clear()
        assert cache.size == 0

    def test_clear_then_put(self):
        cache = OptimizerCache(max_size=3)
        for i in range(3):
            key = _default_key(date=f"2020-01-{i+1:02d}")
            cache.put(key, i)
        cache.clear()
        key = _default_key(date="2020-01-10")
        cache.put(key, 99)
        assert cache.size == 1
        assert cache.get(key) == 99


# ---------------------------------------------------------------------------
# Introspection
# ---------------------------------------------------------------------------

class TestIntrospection:

    def test_len(self):
        cache = OptimizerCache()
        assert len(cache) == 0
        cache.put(_default_key(), "x")
        assert len(cache) == 1

    def test_repr(self):
        cache = OptimizerCache(max_size=8)
        r = repr(cache)
        assert "OptimizerCache" in r
        assert "8" in r

    def test_size_property(self):
        cache = OptimizerCache(max_size=4)
        assert cache.size == 0
        cache.put(_default_key(date="2020-01-01"), "a")
        cache.put(_default_key(date="2020-01-02"), "b")
        assert cache.size == 2
