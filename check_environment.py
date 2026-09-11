"""
check_environment.py

Run this AFTER activating your venv and running `pip install -r requirements.txt`.
It verifies every Phase 1 dependency imports correctly and prints versions,
so any problem is caught here instead of later inside FastAPI.

Usage (Windows, inside backend/ with venv active):
    python check_environment.py

Expected output: every package printed with a version number and
the final line "ALL CHECKS PASSED".
"""

import sys

REQUIRED = [
    "fastapi",
    "uvicorn",
    "pydantic",
    "xarray",
    "netCDF4",
    "numpy",
    "pandas",
    "dotenv",  # python-dotenv's import name is "dotenv", not "python_dotenv"
]

def main():
    print(f"Python version: {sys.version}\n")

    if sys.version_info < (3, 10) or sys.version_info >= (3, 13):
        print(
            "WARNING: Python 3.10, 3.11, or 3.12 is recommended for this project.\n"
            "xarray/netCDF4 prebuilt wheels may not yet support very new Python "
            "versions, which can cause install errors.\n"
        )

    failed = []
    for package in REQUIRED:
        try:
            module = __import__(package)
            version = getattr(module, "__version__", "unknown")
            print(f"  OK   {package:<12} version {version}")
        except ImportError as e:
            print(f"  FAIL {package:<12} -> {e}")
            failed.append(package)

    print()
    if failed:
        print("SOME CHECKS FAILED:", ", ".join(failed))
        print("Fix: run 'pip install -r requirements.txt' again inside your")
        print("activated venv, and check the Task 3 notes for that package.")
        sys.exit(1)
    else:
        # Quick functional smoke test, not just import checks.
        import numpy as np
        import pandas as pd
        import xarray as xr

        arr = np.array([1.0, 2.0, 3.0])
        df = pd.DataFrame({"a": [1, 2, 3]})
        da = xr.DataArray(arr, dims=["x"])

        assert arr.sum() == 6.0
        assert len(df) == 3
        assert da.sum().item() == 6.0

        print("Functional smoke test: numpy, pandas, xarray all working correctly.")
        print("\nALL CHECKS PASSED")


if __name__ == "__main__":
    main()
