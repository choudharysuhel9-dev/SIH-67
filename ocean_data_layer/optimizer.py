"""
ocean_data_layer.optimizer
==========================
Member 5 - Ocean Data Optimization Layer - GENERIC OPTIMIZER

This module is the only component in the entire layer that performs
actual data reduction.  It is strictly source-agnostic:

  - It consumes CommonOceanDataset (produced by any adapter).
  - It knows NOTHING about any specific data source, variable names
    from that source, file names, test coordinates, or source internals.
  - It reads meta.is_gridded to decide which operations are legal.

Design Rules
------------
* Gridded data  (is_gridded=True)  -> coarsen() is allowed.
* Sparse data   (is_gridded=False) -> coarsen() is FORBIDDEN.
  Sparse observations are returned as-is (no fake interpolation).
* Computation is deferred until the caller explicitly requests
  concrete output (compute=True on OptimizedResult, or by calling
  OptimizedResult.to_dict()).
* Output is bounded by max_output_points.  Adaptive resolution
  increases the coarsening step until output fits the limit.
  Explicit requests that exceed the limit raise ValueError.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional

import numpy as np
import xarray as xr

from ocean_data_layer.common import (
    CANONICAL_VARIABLES,
    CommonOceanDataset,
)


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

#: Default upper bound on the number of output data points.
DEFAULT_MAX_OUTPUT_POINTS: int = 500_000

#: Explicit step values the optimizer considers during adaptive resolution.
_ADAPTIVE_STEPS: tuple[int, ...] = (1, 2, 4, 6, 8, 12, 16, 24, 32)


# ---------------------------------------------------------------------------
# QueryParams
# ---------------------------------------------------------------------------

@dataclass
class QueryParams:
    """
    Source-agnostic query specification consumed by OceanDataOptimizer.

    All spatial / temporal parameters are optional; None means "all available".

    Parameters
    ----------
    variable : str
        Canonical variable name (must be in CANONICAL_VARIABLES).
    date : str or None
        ISO-8601 date string for time selection, e.g. ``"2020-01-02"``.
        If None, all time steps are included.
    depth_min : float or None
        Minimum depth (m, positive downward).  Inclusive lower bound.
    depth_max : float or None
        Maximum depth (m, positive downward).  Inclusive upper bound.
    lat_min : float or None
        Minimum latitude (degrees North).
    lat_max : float or None
        Maximum latitude (degrees North).
    lon_min : float or None
        Minimum longitude (degrees East).
    lon_max : float or None
        Maximum longitude (degrees East).
    step : int or None
        Explicit coarsening factor (1 = no coarsening, 2 = take every 2nd
        point, 4 = every 4th, etc.).  Mutually exclusive with adaptive.
        None defers to adaptive resolution mode.
    adaptive : bool
        If True (and step is None), the optimizer automatically selects
        the smallest step that keeps output <= max_output_points.
    max_output_points : int
        Upper bound on total output data points.  Applies to both explicit
        and adaptive modes.
    """

    variable: str
    date: Optional[str] = None
    depth_min: Optional[float] = None
    depth_max: Optional[float] = None
    lat_min: Optional[float] = None
    lat_max: Optional[float] = None
    lon_min: Optional[float] = None
    lon_max: Optional[float] = None
    step: Optional[int] = None
    adaptive: bool = True
    max_output_points: int = DEFAULT_MAX_OUTPUT_POINTS


# ---------------------------------------------------------------------------
# OptimizedResult
# ---------------------------------------------------------------------------

@dataclass
class OptimizedResult:
    """
    Container for an optimizer result.  Computation is deferred until
    ``to_dict()`` or ``compute()`` is called.

    Fields
    ------
    source : str
        Source identifier from OceanDatasetMeta.source_name.
    variable : str
        Canonical variable name that was extracted.
    units : str
        Unit string from the source metadata (or canonical default).
    date : str or None
        Date that was selected (None if all dates were included).
    step_used : int
        The coarsening step actually applied (1 = no coarsening).
    is_gridded : bool
        Whether the source data is gridded.
    _da : xr.DataArray
        The (still-lazy) DataArray after subsetting and coarsening.
    """

    source: str
    variable: str
    units: str
    date: Optional[str]
    step_used: int
    is_gridded: bool
    _da: xr.DataArray = field(repr=False)

    @property
    def shape(self) -> tuple:
        """Shape of the underlying DataArray."""
        return self._da.shape

    def compute(self) -> "OptimizedResult":
        """Trigger Dask computation in-place.  Returns self for chaining."""
        self._da = self._da.load()
        return self

    def to_dict(self) -> dict:
        """
        Compute and serialise the result to a plain Python dict suitable
        for JSON serialisation.

        NaN values are converted to None so JSON remains valid.
        """
        da = self._da.load()
        values_np = da.values

        # NaN -> None for JSON safety
        values = np.where(np.isnan(values_np), None, values_np).tolist()

        coords: dict = {}
        for dim in da.dims:
            coord_vals = da.coords[dim].values
            if np.issubdtype(coord_vals.dtype, np.datetime64):
                coords[dim] = [str(v) for v in coord_vals]
            else:
                coords[dim] = coord_vals.tolist()

        return {
            "source":     self.source,
            "variable":   self.variable,
            "units":      self.units,
            "date":       self.date,
            "step_used":  self.step_used,
            "is_gridded": self.is_gridded,
            "shape":      list(da.shape),
            "dims":       list(da.dims),
            "coords":     coords,
            "values":     values,
        }


# ---------------------------------------------------------------------------
# OceanDataOptimizer
# ---------------------------------------------------------------------------

class OceanDataOptimizer:
    """
    Generic, source-agnostic optimizer for CommonOceanDataset objects.

    Parameters
    ----------
    dataset : CommonOceanDataset
        The dataset to optimise.  Must have been produced by a compliant
        adapter (canonical names, Dask-backed, meta fully populated).
    max_output_points : int, optional
        Default upper bound on output points.  Individual QueryParams
        can override this per-request.
    """

    def __init__(
        self,
        dataset: CommonOceanDataset,
        max_output_points: int = DEFAULT_MAX_OUTPUT_POINTS,
    ) -> None:
        self._dataset = dataset
        self._default_max_output_points = max_output_points

    def optimize(self, params: QueryParams) -> OptimizedResult:
        """
        Run the full optimization pipeline for the given query.

        Returns
        -------
        OptimizedResult
            A lazy result container.  Call ``.to_dict()`` to compute.

        Raises
        ------
        ValueError
            If any parameter is invalid, or if an explicit step would
            exceed max_output_points.
        """
        meta = self._dataset.meta
        ds   = self._dataset.data

        # 1. Validate variable
        self._validate_variable(params.variable, meta.variables)

        # 2. Validate all scalar parameters
        self._validate_params(params)

        # 3. Select variable
        da: xr.DataArray = ds[params.variable]

        # 4. Time selection
        da = self._select_time(da, params.date)

        # 5. Depth subsetting
        da = self._subset_depth(da, params.depth_min, params.depth_max)

        # 6. Spatial subsetting
        da = self._subset_spatial(
            da,
            params.lat_min, params.lat_max,
            params.lon_min, params.lon_max,
        )

        # 7. Effective max output points
        effective_max = (
            params.max_output_points
            if params.max_output_points is not None
            else self._default_max_output_points
        )

        # 8. Coarsening (gridded only)
        if meta.is_gridded:
            step_used = self._resolve_step(da, params, effective_max)
            da = self._apply_coarsen(da, step_used)
        else:
            step_used = 1
            self._check_sparse_output_size(da, effective_max)

        # 9. Final output-size guard
        self._enforce_output_limit(da, effective_max)

        # 10. Units
        units = meta.units.get(
            params.variable,
            CANONICAL_VARIABLES.get(params.variable, "unknown"),
        )

        return OptimizedResult(
            source=meta.source_name,
            variable=params.variable,
            units=units,
            date=params.date,
            step_used=step_used,
            is_gridded=meta.is_gridded,
            _da=da,
        )

    # ------------------------------------------------------------------
    # Validation helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _validate_variable(variable: str, available: list) -> None:
        if variable not in CANONICAL_VARIABLES:
            raise ValueError(
                f"Unknown variable {variable!r}. "
                f"Must be one of: {sorted(CANONICAL_VARIABLES)}"
            )
        if variable not in available:
            raise ValueError(
                f"Variable {variable!r} is not available in this dataset. "
                f"Available: {sorted(available)}"
            )

    @staticmethod
    def _validate_params(params: QueryParams) -> None:
        if params.step is not None:
            if not isinstance(params.step, int) or params.step < 1:
                raise ValueError(
                    f"step must be a positive integer, got {params.step!r}"
                )

        if params.depth_min is not None and params.depth_max is not None:
            if params.depth_min > params.depth_max:
                raise ValueError(
                    f"depth_min ({params.depth_min}) > depth_max ({params.depth_max})"
                )
        if params.depth_min is not None and params.depth_min < 0:
            raise ValueError(
                f"depth_min must be non-negative, got {params.depth_min}"
            )

        if params.lat_min is not None and params.lat_max is not None:
            if params.lat_min > params.lat_max:
                raise ValueError(
                    f"lat_min ({params.lat_min}) > lat_max ({params.lat_max})"
                )
        for v, name in [(params.lat_min, "lat_min"), (params.lat_max, "lat_max")]:
            if v is not None and not (-90 <= v <= 90):
                raise ValueError(f"{name}={v} is outside [-90, 90]")

        if params.lon_min is not None and params.lon_max is not None:
            if params.lon_min > params.lon_max:
                raise ValueError(
                    f"lon_min ({params.lon_min}) > lon_max ({params.lon_max})"
                )
        for v, name in [(params.lon_min, "lon_min"), (params.lon_max, "lon_max")]:
            if v is not None and not (-180 <= v <= 360):
                raise ValueError(f"{name}={v} is outside [-180, 360]")

        if params.max_output_points is not None and params.max_output_points < 1:
            raise ValueError(
                f"max_output_points must be >= 1, got {params.max_output_points}"
            )

    # ------------------------------------------------------------------
    # Selection helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _select_time(da: xr.DataArray, date: Optional[str]) -> xr.DataArray:
        if date is None:
            return da
        if "time" not in da.dims:
            return da
        try:
            return da.sel(time=date)
        except KeyError:
            raise ValueError(
                f"Date {date!r} is not available in the dataset. "
                f"Available: {da.coords['time'].values.tolist()}"
            )

    @staticmethod
    def _subset_depth(
        da: xr.DataArray,
        depth_min: Optional[float],
        depth_max: Optional[float],
    ) -> xr.DataArray:
        if "depth" not in da.dims:
            return da
        if depth_min is None and depth_max is None:
            return da
        lo = depth_min if depth_min is not None else float("-inf")
        hi = depth_max if depth_max is not None else float("inf")
        return da.sel(depth=slice(lo, hi))

    @staticmethod
    def _subset_spatial(
        da: xr.DataArray,
        lat_min: Optional[float],
        lat_max: Optional[float],
        lon_min: Optional[float],
        lon_max: Optional[float],
    ) -> xr.DataArray:
        if "latitude" in da.dims:
            lo = lat_min if lat_min is not None else -90.0
            hi = lat_max if lat_max is not None else 90.0
            da = da.sel(latitude=slice(lo, hi))
        if "longitude" in da.dims:
            lo = lon_min if lon_min is not None else -180.0
            hi = lon_max if lon_max is not None else 360.0
            da = da.sel(longitude=slice(lo, hi))
        return da

    # ------------------------------------------------------------------
    # Coarsening helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _estimate_output_points(da: xr.DataArray, step: int) -> int:
        total = 1
        for dim, size in zip(da.dims, da.shape):
            if dim in ("latitude", "longitude"):
                total *= max(1, size // step)
            else:
                total *= max(1, size)
        return total

    def _resolve_step(
        self,
        da: xr.DataArray,
        params: QueryParams,
        effective_max: int,
    ) -> int:
        if params.step is not None:
            estimated = self._estimate_output_points(da, params.step)
            if estimated > effective_max:
                raise ValueError(
                    f"Explicit step={params.step} would produce ~{estimated:,} "
                    f"output points, exceeding max_output_points={effective_max:,}. "
                    f"Increase step, tighten the selection, or raise max_output_points."
                )
            return params.step

        for step in _ADAPTIVE_STEPS:
            if self._estimate_output_points(da, step) <= effective_max:
                return step

        largest = _ADAPTIVE_STEPS[-1]
        estimated = self._estimate_output_points(da, largest)
        raise ValueError(
            f"Even maximum adaptive step={largest} produces ~{estimated:,} "
            f"points, exceeding max_output_points={effective_max:,}. "
            f"Tighten your spatial selection or raise max_output_points."
        )

    @staticmethod
    def _apply_coarsen(da: xr.DataArray, step: int) -> xr.DataArray:
        if step == 1:
            return da
        coarsen_kwargs: dict = {}
        if "latitude" in da.dims and da.sizes["latitude"] >= step:
            coarsen_kwargs["latitude"] = step
        if "longitude" in da.dims and da.sizes["longitude"] >= step:
            coarsen_kwargs["longitude"] = step
        if not coarsen_kwargs:
            return da
        return da.coarsen(boundary="trim", **coarsen_kwargs).mean(skipna=True)

    # ------------------------------------------------------------------
    # Output-size protection helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _check_sparse_output_size(da: xr.DataArray, effective_max: int) -> None:
        total = int(np.prod(da.shape))
        if total > effective_max:
            raise ValueError(
                f"Sparse query would return {total:,} points, exceeding "
                f"max_output_points={effective_max:,}. "
                f"Tighten your selection or raise max_output_points."
            )

    @staticmethod
    def _enforce_output_limit(da: xr.DataArray, effective_max: int) -> None:
        total = int(np.prod(da.shape))
        if total > effective_max:
            raise ValueError(
                f"Output size {total:,} exceeds max_output_points={effective_max:,}. "
                f"Safety guard triggered - please tighten your query parameters."
            )
