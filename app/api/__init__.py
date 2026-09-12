"""
app/api/

All FastAPI route files (routers) live here.

Each file = one resource/feature area, e.g. (added in later tasks):
    - health.py        -> GET /api/health
    - datasets.py       -> GET /api/datasets, /api/variables, /api/times, /api/depths
    - model.py          -> GET /api/model, /api/model/profile
    - instruments.py    -> GET /api/instruments, /api/instruments/{id}, .../profile
    - compare.py        -> GET /api/compare
    - current.py         -> GET /api/current

Owner: Member 3 (you).
main.py will import and register these routers - not yet wired up (Task 1 only).
"""
