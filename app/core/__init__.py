"""
app/core/

App-wide configuration and settings - things that don't belong to
any single feature. Kept separate so config changes (e.g. new env
variable, new CORS origin) don't require touching business logic.

Planned files (added in later tasks):
    - config.py    -> Settings class (reads .env), allowed variables list,
                       CORS origins, NetCDF file path, cache TTL, etc.
    - constants.py -> shared constants (e.g. SUPPORTED_VARIABLES list)

Owner: Member 3 (you).
"""
