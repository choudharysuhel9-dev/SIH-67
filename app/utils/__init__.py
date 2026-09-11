"""
app/utils/

Small, generic, reusable helper functions that don't belong to a
specific service - e.g. NaN/missing-value cleanup before JSON
serialization, datetime parsing helpers, simple in-memory cache
decorator, distance/interpolation math helpers.

Rule of thumb: if a function could be copy-pasted into a completely
different project with zero changes, it belongs here, not in services/.

Owner: Member 3 (you). Used by services/ and api/ files.
"""
