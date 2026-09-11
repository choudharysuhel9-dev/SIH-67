"""
app/core/constants.py

Single source of truth for "what is valid" across the whole backend.
Services and schemas import from here so there's never a mismatch
between what /api/variables advertises and what /api/model accepts.

When real NetCDF/xarray data is connected later, SUPPORTED_VARIABLES
and DEPTHS should be derived from the actual dataset instead of being
hardcoded here — but the shape of these structures stays the same,
so nothing that imports them needs to change.
"""

# variable_id -> display metadata
SUPPORTED_VARIABLES = {
    "temperature": {"name": "Temperature", "unit": "°C"},
    "salinity": {"name": "Salinity", "unit": "PSU"},
    "chlorophyll": {"name": "Chlorophyll", "unit": "mg/m3"},
    "current_u": {"name": "Eastward Current (U)", "unit": "m/s"},
    "current_v": {"name": "Northward Current (V)", "unit": "m/s"},
}

# Mock depth levels in meters (matches the plan's example: 0..1000m)
DEPTHS = [0, 10, 20, 50, 75, 90]
# Datasets exposed by the platform
DATASETS = [
    {
        "id": "ocean_model",
        "name": "Ocean Model Output",
        "description": "Gridded 3D ocean model fields (temperature, salinity, currents, chlorophyll).",
    },
    {
        "id": "argo",
        "name": "Argo Profiling Floats",
        "description": "Autonomous floats providing depth profiles of temperature and salinity.",
    },
    {
        "id": "glider",
        "name": "Underwater Gliders",
        "description": "Glider-based depth profiles used to validate model output.",
    },
]

# Comparison is only meaningful for variables that both the model
# and the instruments measure directly.
COMPARABLE_VARIABLES = ["temperature", "salinity"]
