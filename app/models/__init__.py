"""
app/models/

Reserved for database ORM models (e.g. SQLAlchemy models) - NOT
Pydantic schemas (those go in app/schemas/).

STATUS: Empty for now / future use.
For the hackathon MVP we are not using a database (PostgreSQL/PostGIS
is explicitly deferred in the plan), so this folder stays empty until
persistence is genuinely needed - e.g. storing metadata about uploaded
NetCDF files, or caching Argo/Glider records. Kept in the structure now
so adding a DB later doesn't require restructuring the project.

Owner: Member 3 (you), only if/when a database is introduced.
"""
