"""
app/services/

Business logic lives here, kept separate from the API layer.

API route files (app/api/*.py) should stay "thin": they just
validate input and call a service function. All the real work -
reading NetCDF with xarray, slicing arrays, computing RMSE/MAE/bias,
generating dummy data, caching lookups - happens in this folder.

Planned files (added in later tasks):
    - dataset_service.py     -> opens NetCDF, lists variables/depths/times
    - model_service.py       -> slices model fields for /api/model
    - instrument_service.py  -> Argo/Glider data access
    - compare_service.py     -> model vs observation comparison logic
    - current_service.py     -> speed/direction calculation
    - dummy_data.py          -> sample data for early frontend development

Owner: Member 3 (you). This is the core of your backend work.
"""
