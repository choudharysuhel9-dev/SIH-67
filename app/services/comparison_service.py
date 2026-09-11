"""
app/services/comparison_service.py

Backs GET /api/compare - the project's signature feature.

Formulas (simple, in plain English):
- RMSE (Root Mean Squared Error): square each error, average them,
  take the square root. Penalizes big misses more than small ones.
- MAE (Mean Absolute Error): average of |model - observation|.
  Easier to interpret directly in the variable's own units.
- Bias: average of (model - observation), signed. Positive means the
  model tends to read higher than the instrument; negative means lower.

STATUS: Mock data only, reusing instrument_service's mock profile as
the "observation" and model_service's mock value generator as the
"model" at the instrument's location. Once both are real, this
function's logic (matching depths, computing metrics) does not change -
only where observation/model values come from does.
"""

import math
from typing import List

from fastapi import HTTPException

from app.core.constants import COMPARABLE_VARIABLES
from app.schemas.comparison import CompareResponse, ComparisonMetrics
from app.services.instrument_service import get_instrument, get_instrument_profile
from app.services.model_service import validate_variable
from app.services import netcdf_service


def _validate_comparable_variable(variable: str) -> None:
    validate_variable(variable)

    if variable not in COMPARABLE_VARIABLES:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Unsupported comparison variable",
                "message": (
                    f"Comparison is only available for variables measured by "
                    f"instruments directly, got '{variable}'"
                ),
                "available_variables": COMPARABLE_VARIABLES,
            },
        )


def compare(instrument_id: str, variable: str) -> CompareResponse:
    _validate_comparable_variable(variable)

    instrument = get_instrument(instrument_id)
    profile = get_instrument_profile(instrument_id)

    observation: List[float] = (
        profile.temperature
        if variable == "temperature"
        else profile.salinity
    )

    model_values: List[float] = []

    # Get model data for each observation depth
    for d in profile.depth:

        model_data = netcdf_service.get_model_data(
    variable=variable,
    depth=d,
    time=instrument.timestamp,
    min_lon=instrument.longitude - 0.1,
    max_lon=instrument.longitude + 0.1,
    min_lat=instrument.latitude - 0.1,
    max_lat=instrument.latitude + 0.1,
)

        values = model_data["values"]

        if not values or not values[0]:
            raise HTTPException(
                status_code=404,
                detail=f"No model data found for depth {d}",
            )

        model_value = values[0][0]
        model_values.append(model_value)

    valid_pairs = [
    (m, o)
    for m, o in zip(model_values, observation)
    if m is not None and o is not None
]

    if not valid_pairs:
     raise HTTPException(
        status_code=404,
        detail="No valid model-observation pairs available for comparison",
    )

    model_values = [m for m, o in valid_pairs]
    observation = [o for m, o in valid_pairs]

    errors = [
    m - o
    for m, o in valid_pairs
]

    n = len(errors)

    if n == 0:
        raise HTTPException(
            status_code=400,
            detail="No observation data available for comparison",
        )

    rmse = round(
        math.sqrt(sum(e ** 2 for e in errors) / n),
        3,
    )

    mae = round(
        sum(abs(e) for e in errors) / n,
        3,
    )

    bias = round(
        sum(errors) / n,
        3,
    )

    return CompareResponse(
        instrument_id=instrument_id,
        variable=variable,
        depth=profile.depth,
        observation=observation,
        model=model_values,
        metrics=ComparisonMetrics(
            rmse=rmse,
            mae=mae,
            bias=bias,
        ),
    )