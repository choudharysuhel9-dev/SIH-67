"""
ocean_data_layer.cache
======================
Bounded LRU-style cache for OptimizedResult objects.

Design decisions
----------------
* Uses an OrderedDict to implement LRU eviction without external deps.
* Cache keys include EVERY parameter that can change the output, so
  that two different queries never collide.
* The cache is independent of the optimizer and API layers - it can be
  used by any caller that has a serialisable cache key.
* Maximum size is configurable; default is 128 entries.
* Thread-safety: not implemented (single-threaded API assumed for Phase 1).
  For multi-threaded use, wrap calls in a threading.Lock.

Cache key components
--------------------
    source, variable, date, depth_min, depth_max,
    lat_min, lat_max, lon_min, lon_max,
    step, adaptive, max_output_points

All values are normalised to primitives (float or None, int or None)
so that equivalent queries with different Python numeric types produce
identical keys.
"""

from __future__ import annotations

from collections import OrderedDict
from typing import Any, Optional


# ---------------------------------------------------------------------------
# Default configuration
# ---------------------------------------------------------------------------

DEFAULT_CACHE_MAX_SIZE: int = 128


# ---------------------------------------------------------------------------
# Cache key builder
# ---------------------------------------------------------------------------

def make_cache_key(
    *,
    source: str,
    variable: str,
    date: Optional[str],
    depth_min: Optional[float],
    depth_max: Optional[float],
    lat_min: Optional[float],
    lat_max: Optional[float],
    lon_min: Optional[float],
    lon_max: Optional[float],
    step: Optional[int],
    adaptive: bool,
    max_output_points: int,
) -> tuple:
    """
    Build a fully-qualified, hashable cache key.

    Every parameter that can change the optimizer output is included.
    Numeric values are cast to their canonical types so that e.g.
    ``depth_min=0`` and ``depth_min=0.0`` produce the same key.

    Parameters
    ----------
    source : str
        Source name (from OceanDatasetMeta.source_name).
    variable : str
        Canonical variable name.
    date : str or None
        ISO-8601 date string, or None for all dates.
    depth_min, depth_max : float or None
        Depth bounds in metres.
    lat_min, lat_max : float or None
        Latitude bounds in degrees North.
    lon_min, lon_max : float or None
        Longitude bounds in degrees East.
    step : int or None
        Explicit coarsening step, or None for adaptive.
    adaptive : bool
        Whether adaptive resolution is active.
    max_output_points : int
        Output-size limit that affects the adaptive step chosen.

    Returns
    -------
    tuple
        A hashable tuple that uniquely identifies this query.
    """
    def _f(v: Optional[float]) -> Optional[float]:
        """Normalise to float or None."""
        return float(v) if v is not None else None

    def _i(v: Optional[int]) -> Optional[int]:
        """Normalise to int or None."""
        return int(v) if v is not None else None

    return (
        str(source),
        str(variable),
        str(date) if date is not None else None,
        _f(depth_min),
        _f(depth_max),
        _f(lat_min),
        _f(lat_max),
        _f(lon_min),
        _f(lon_max),
        _i(step),
        bool(adaptive),
        int(max_output_points),
    )


# ---------------------------------------------------------------------------
# OptimizerCache
# ---------------------------------------------------------------------------

class OptimizerCache:
    """
    Bounded LRU cache for optimizer results.

    Uses an OrderedDict where the most-recently-used entry is moved to
    the end; eviction removes from the front (oldest entry).

    Parameters
    ----------
    max_size : int
        Maximum number of entries to retain.  When the limit is reached,
        the least-recently-used entry is evicted before the new one is
        stored.  Default: ``DEFAULT_CACHE_MAX_SIZE`` (128).

    Usage
    -----
    ::

        cache = OptimizerCache(max_size=64)
        key = make_cache_key(source="s", variable="temperature", ...)

        if cache.has(key):
            result = cache.get(key)
        else:
            result = optimizer.optimize(params)
            cache.put(key, result)
    """

    def __init__(self, max_size: int = DEFAULT_CACHE_MAX_SIZE) -> None:
        if max_size < 1:
            raise ValueError(f"max_size must be >= 1, got {max_size}")
        self._max_size = max_size
        self._store: OrderedDict = OrderedDict()

    # ------------------------------------------------------------------
    # Core operations
    # ------------------------------------------------------------------

    def get(self, key: tuple) -> Any:
        """
        Retrieve a cached value and mark it as most-recently used.

        Parameters
        ----------
        key : tuple
            A key previously returned by :func:`make_cache_key`.

        Returns
        -------
        Any
            The cached value.

        Raises
        ------
        KeyError
            If the key is not in the cache.
        """
        self._store.move_to_end(key)  # raises KeyError if absent
        return self._store[key]

    def put(self, key: tuple, value: Any) -> None:
        """
        Store a value.  Evicts the LRU entry if the cache is full.

        If the key already exists, the value is updated and the entry
        is moved to the most-recently-used position.

        Parameters
        ----------
        key : tuple
            Cache key.
        value : Any
            Value to store.
        """
        if key in self._store:
            self._store.move_to_end(key)
            self._store[key] = value
            return

        if len(self._store) >= self._max_size:
            self._store.popitem(last=False)  # evict LRU (front)

        self._store[key] = value

    def has(self, key: tuple) -> bool:
        """Return True if the key is present in the cache."""
        return key in self._store

    def invalidate(self, key: tuple) -> bool:
        """
        Remove a specific key from the cache.

        Returns True if the key was present and removed, False otherwise.
        """
        if key in self._store:
            del self._store[key]
            return True
        return False

    def clear(self) -> None:
        """Remove all entries from the cache."""
        self._store.clear()

    # ------------------------------------------------------------------
    # Introspection
    # ------------------------------------------------------------------

    @property
    def size(self) -> int:
        """Current number of cached entries."""
        return len(self._store)

    @property
    def max_size(self) -> int:
        """Maximum number of entries the cache will hold."""
        return self._max_size

    def __len__(self) -> int:
        return len(self._store)

    def __repr__(self) -> str:
        return (
            f"OptimizerCache(size={self.size}/{self.max_size})"
        )
