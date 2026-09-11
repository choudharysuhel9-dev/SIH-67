"""
scripts/inspect_netcdf.py

Inspects a NetCDF file (local path OR a remote URL xarray can open,
e.g. an OPeNDAP endpoint) WITHOUT loading the full scientific arrays
into memory. Prints exactly what Task 4 needs to confirm before any
backend code is written:

  - dimensions
  - coordinates (time, depth, latitude, longitude) with their real ranges
  - every data variable's real name, dims, shape, dtype
  - units, long_name, standard_name
  - fill value / missing value handling
  - global attributes

Usage:
    python scripts/inspect_netcdf.py path/to/test_ocean.nc
    python scripts/inspect_netcdf.py path/to/test_ocean.nc --stats

--stats additionally computes min/max per variable. This is opt-in
because it forces xarray to actually read the data (fine for a small
subset file, but would be expensive/unwanted on a huge or remote file).
"""

import argparse
import sys

import xarray as xr


def inspect(path: str, show_stats: bool) -> None:
    print(f"Opening: {path}\n")
    try:
        # decode_cf via default open_dataset keeps all variables lazy
        # (dask-free but not read into memory) until .load()/.values
        # is explicitly called.
        ds = xr.open_dataset(path)
    except FileNotFoundError:
        print(f"ERROR: file not found: {path}")
        sys.exit(1)
    except Exception as exc:
        print(f"ERROR: could not open dataset: {exc}")
        sys.exit(1)

    print("=" * 70)
    print("DIMENSIONS")
    print("=" * 70)
    for name, size in ds.sizes.items():
        print(f"  {name:<15} = {size}")

    print()
    print("=" * 70)
    print("COORDINATES")
    print("=" * 70)
    for name, coord in ds.coords.items():
        vals = coord.values
        if vals.size > 1:
            preview = f"{vals[0]} ... {vals[-1]}  ({vals.size} points)"
        else:
            preview = str(vals)
        print(f"  {name:<15} dtype={coord.dtype}  shape={coord.shape}")
        print(f"  {'':<15} range = [{preview}]")
        for attr_key in ("units", "standard_name", "long_name", "axis", "positive"):
            if attr_key in coord.attrs:
                print(f"  {'':<15} {attr_key} = {coord.attrs[attr_key]}")
        print()

    print("=" * 70)
    print("DATA VARIABLES")
    print("=" * 70)
    for name, var in ds.data_vars.items():
        print(f"\n- {name}")
        print(f"    dims        : {var.dims}")
        print(f"    shape       : {var.shape}")
        print(f"    dtype       : {var.dtype}")
        print(f"    units       : {var.attrs.get('units', '(none)')}")
        print(f"    long_name   : {var.attrs.get('long_name', '(none)')}")
        print(f"    standard_name : {var.attrs.get('standard_name', '(none)')}")

        fill = var.attrs.get("_FillValue", var.encoding.get("_FillValue", "(none)"))
        missing = var.attrs.get("missing_value", "(none)")
        print(f"    _FillValue  : {fill}")
        print(f"    missing_value : {missing}")

        if show_stats:
            data = var.load()
            print(f"    min         : {float(data.min())}")
            print(f"    max         : {float(data.max())}")

    print()
    print("=" * 70)
    print("GLOBAL ATTRIBUTES")
    print("=" * 70)
    for key, value in ds.attrs.items():
        print(f"  {key}: {value}")

    ds.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Inspect a NetCDF file or remote dataset URL.")
    parser.add_argument("path", help="Local file path or remote URL xarray can open")
    parser.add_argument("--stats", action="store_true", help="Also compute min/max (forces a real data read)")
    args = parser.parse_args()
    inspect(args.path, args.stats)
