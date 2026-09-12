"""
app/schemas/

Pydantic models that define the JSON "data contract" between your
backend and the React/Cesium frontend (Member 1) - and the validation
rules for incoming requests (e.g. allowed variable names, depth >= 0).

Planned files (added in later tasks):
    - model_schemas.py       -> ModelDataResponse, request query params
    - instrument_schemas.py  -> ArgoGliderRecord, ProfileResponse
    - compare_schemas.py     -> CompareResponse, MetricsSchema
    - common_schemas.py      -> shared error response models, enums

Owner: Member 3 (you). This is what Member 1 (frontend) will read
to know exactly what JSON shape to expect from each endpoint.
"""
