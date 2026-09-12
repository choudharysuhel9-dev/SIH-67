# Ocean Data Visualization — Backend (Member 3)

Backend for the *Web-based Interactive 3D Ocean Data Visualization Platform*
(FastAPI + xarray, serving model/instrument data to the React + CesiumJS frontend).

## Status
Task 1 complete: folder structure scaffolded. No endpoints implemented yet.

## Folder structure

```
backend/
├── app/
│   ├── main.py       # FastAPI app entry point (skeleton - Task 4 adds real app)
│   ├── api/           # Route files: one per resource (health, model, instruments...)
│   ├── services/      # Business logic: xarray/NetCDF access, comparison math, dummy data
│   ├── schemas/       # Pydantic models = the JSON contract with the frontend
│   ├── models/        # DB ORM models (empty — no DB in MVP)
│   ├── core/          # App-wide config (.env loading, constants)
│   └── utils/         # Small reusable helpers (NaN cleanup, caching, etc.)
├── data/               # Local NetCDF/ASCII files (git-ignored, not committed)
├── tests/              # pytest test files, mirrors app/api/
├── requirements.txt    # Python dependencies (filled in next task)
├── .env / .env.example # Local config / secrets template
├── .gitignore
├── Dockerfile           # placeholder, filled in a later task
└── README.md            # this file
```

## Next steps (in order)
1. Environment setup (venv, install deps)
2. Add real dependencies to requirements.txt
3. Build out app/main.py (FastAPI app + CORS + /api/health)
4. Design and implement API routes in app/api/
5. Add dummy data in app/services/ so frontend can start early
6. Connect real NetCDF via xarray
