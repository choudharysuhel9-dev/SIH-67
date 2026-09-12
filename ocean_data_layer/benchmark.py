"""
ocean_data_layer/benchmark.py
=============================
Benchmark tool for the OceanDataOptimizer.

Measures processing time, input/output shapes, point counts, and
reduction percentages for step values 1, 2, 4, 6.

Uses the Copernicus development dataset ONLY as a test fixture;
all generic optimizer code is source-agnostic.

Usage
-----
    python -m ocean_data_layer.benchmark
    python -m ocean_data_layer.benchmark --file path/to/file.nc

Set OCEAN_TEST_FILE environment variable to override the default path.
"""

from __future__ import annotations

import argparse
import math
import os
import time
import tracemalloc

import numpy as np

_DEFAULT_FILE = (
    "cmems_mod_glo_phy_my_0.083deg_P1D-m_thetao_"
    "70.00E-75.00E_10.00N-15.00N_0.49-92.33m_"
    "2020-01-01-2020-01-03.nc"
)

BENCHMARK_STEPS = (1, 2, 4, 6)


def run_benchmark(file_path: str) -> None:
    """
    Run the benchmark against ``file_path``.

    Parameters
    ----------
    file_path : str
        Path to a NetCDF file loadable by CopernicusNetCDFAdapter.
    """
    # Late imports so the benchmark module itself has no hard dependencies
    from ocean_data_layer.adapters.copernicus_adapter import CopernicusNetCDFAdapter
    from ocean_data_layer.optimizer import OceanDataOptimizer, QueryParams

    print("=" * 60)
    print("Ocean Data Optimizer - Benchmark")
    print("=" * 60)
    print(f"File: {file_path}")

    if not os.path.isfile(file_path):
        print(f"\nERROR: File not found: {file_path!r}")
        print("Set OCEAN_TEST_FILE env var or pass --file argument.")
        return

    # Load dataset once (adapter initialisation is separate from benchmark)
    adapter = CopernicusNetCDFAdapter()
    ocean_ds = adapter.load(file_path=file_path)
    optimizer = OceanDataOptimizer(ocean_ds)

    ds = ocean_ds.data
    input_shape = ds["temperature"].shape
    input_points = int(np.prod(input_shape))

    print(f"\nDataset shape : {input_shape}")
    print(f"Input points  : {input_points:,}")
    print()

    print(
        f"{'step':>4}  {'out_shape':>22}  {'out_pts':>10}  "
        f"{'reduction':>10}  {'time_s':>8}  {'mem_mb':>8}"
    )
    print("-" * 72)

    for step in BENCHMARK_STEPS:
        params = QueryParams(
            variable="temperature",
            step=step,
            adaptive=False,
            max_output_points=input_points,  # allow full dataset in step=1
        )

        tracemalloc.start()
        t0 = time.perf_counter()

        result = optimizer.optimize(params)
        result.compute()  # trigger Dask computation

        elapsed = time.perf_counter() - t0
        _, mem_peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()

        out_shape = result.shape
        out_points = int(np.prod(out_shape))
        reduction_pct = 100.0 * (1.0 - out_points / input_points)
        mem_mb = mem_peak / (1024 * 1024)

        print(
            f"{step:>4}  {str(out_shape):>22}  {out_points:>10,}  "
            f"{reduction_pct:>9.1f}%  {elapsed:>8.4f}  {mem_mb:>8.2f}"
        )

    print()
    print("Benchmark complete.")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Benchmark the OceanDataOptimizer with different step values."
    )
    parser.add_argument(
        "--file",
        default=os.environ.get("OCEAN_TEST_FILE", _DEFAULT_FILE),
        help="Path to the NetCDF test file (default: OCEAN_TEST_FILE env var).",
    )
    args = parser.parse_args()
    run_benchmark(args.file)


if __name__ == "__main__":
    main()
