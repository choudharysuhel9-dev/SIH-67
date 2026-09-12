"""
app/core/config.py

App-wide settings, loaded from environment variables (via .env) with
sensible defaults so the app runs even if .env is empty — important
for a hackathon where teammates may not have configured .env yet.
"""

import os
from dotenv import load_dotenv

load_dotenv()
NETCDF_DATA_PATH = os.getenv("NETCDF_DATA_PATH", "data/ocean.nc")

API_TITLE = "Ocean Data Visualization API"
API_VERSION = "0.1.0"
API_DESCRIPTION = (
    "Backend API serving ocean model fields and instrument (Argo/Glider) "
    "data to the 3D visualization frontend. Phase 1 uses mock data; "
    "real NetCDF/xarray integration follows in a later task."
)

# Comma-separated list of allowed frontend origins for CORS.
# Defaults cover the typical Vite (5173, 5174, 5175) and CRA (3000) dev servers.
_default_origins = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:5175,http://127.0.0.1:5175,http://localhost:3000,http://127.0.0.1:3000"
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", _default_origins).split(",")
    if origin.strip()
]
