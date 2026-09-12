"""
ocean_data_layer
================
Member 5 — Ocean Data Optimization Layer

Phase 1 public surface:
  CommonOceanDataset  — the standardised container every adapter produces
  OceanDatasetMeta    — source-agnostic metadata attached to every dataset
  BaseOceanAdapter    — ABC that every source adapter must implement

Phase 2 public surface:
  OceanDataOptimizer  — generic, source-agnostic optimizer
  QueryParams         — typed query specification
  OptimizedResult     — lazy result container with to_dict() serialisation
  OptimizerCache      — bounded LRU cache for optimizer results
  make_cache_key      — canonical cache-key builder
"""

from ocean_data_layer.common import CommonOceanDataset, OceanDatasetMeta
from ocean_data_layer.adapters.base_adapter import BaseOceanAdapter
from ocean_data_layer.optimizer import (
    OceanDataOptimizer,
    QueryParams,
    OptimizedResult,
    DEFAULT_MAX_OUTPUT_POINTS,
)
from ocean_data_layer.cache import OptimizerCache, make_cache_key

__all__ = [
    # Phase 1
    "CommonOceanDataset",
    "OceanDatasetMeta",
    "BaseOceanAdapter",
    # Phase 2
    "OceanDataOptimizer",
    "QueryParams",
    "OptimizedResult",
    "DEFAULT_MAX_OUTPUT_POINTS",
    "OptimizerCache",
    "make_cache_key",
]

