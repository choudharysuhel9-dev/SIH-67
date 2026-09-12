"""
ocean_data_layer.adapters.base_adapter
======================================
Abstract base class that every source adapter must implement.

Contract
--------
An adapter's sole responsibility is to read a specific data source
and return a CommonOceanDataset whose coordinate names and variable
names ALL conform to the canonical tables in ocean_data_layer.common.

An adapter must NOT:
  - Perform spatial subsetting (optimizer's job in Phase 2)
  - Perform temporal selection (optimizer's job in Phase 2)
  - Apply downsampling or coarsening (optimizer's job in Phase 2)
  - Cache results (API layer's job — Member 3)
  - Call .load() or .compute() on Dask arrays (optimizer's job)
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from ocean_data_layer.common import CommonOceanDataset


class BaseOceanAdapter(ABC):
    """
    Abstract base class for all ocean data source adapters.

    Subclass this and implement:
      - ``source_name`` property
      - ``load(**source_kwargs)`` method

    Example (minimal)::

        class MyAdapter(BaseOceanAdapter):

            @property
            def source_name(self) -> str:
                return "my_source"

            def load(self, *, file_path: str) -> CommonOceanDataset:
                ...
                return CommonOceanDataset(meta=..., data=renamed_ds)
    """

    @property
    @abstractmethod
    def source_name(self) -> str:
        """
        Human-readable, machine-stable identifier for this data source.

        Must be snake_case and unique across all adapters registered in the
        system.  This value is written into ``OceanDatasetMeta.source_name``
        and appears in API responses — do not change it once deployed.

        Examples:
            ``"copernicus_glorys12v1"``
            ``"argo_bgc"``
            ``"glider_obs"``
        """
        ...  # pragma: no cover

    @abstractmethod
    def load(self, **source_kwargs) -> CommonOceanDataset:
        """
        Load source data and return a ``CommonOceanDataset``.

        Parameters
        ----------
        **source_kwargs:
            Source-specific keyword arguments.  Each concrete adapter
            documents the keywords it accepts.  Using ``**kwargs`` keeps
            the base-class signature flexible so that file-based, URL-based,
            and API-based adapters can all share this interface.

            Examples:
                CopernicusNetCDFAdapter.load(file_path="data/ocean.nc")
                (future) ArgoAdapter.load(float_id="6901234", date="2023-01-01")

        Returns
        -------
        CommonOceanDataset
            A dataset that satisfies ALL of the following invariants:

            1. Every dimension name is a member of CANONICAL_COORDS
               (``time``, ``depth``, ``latitude``, ``longitude``).
            2. Every data-variable name is a key in CANONICAL_VARIABLES
               (``temperature``, ``salinity``, ``u_velocity``, ``v_velocity``,
               ``ssh``).
            3. ``meta.is_gridded`` is set to reflect whether the data is on a
               regular 4-D grid (True) or consists of irregular observations
               (False).
            4. The xr.Dataset is Dask-backed (lazy); ``.load()`` has NOT been
               called.  Triggering computation is the optimizer's job.

        Raises
        ------
        FileNotFoundError
            If a required local file is missing.
        ValueError
            If the source data cannot be interpreted or required variables
            are absent.
        """
        ...  # pragma: no cover
