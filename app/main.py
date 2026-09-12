"""
app/main.py

Entry point of the FastAPI backend.

STATUS: Real app (Task 3). Creates the FastAPI instance, configures
CORS for the React/Cesium frontend, registers every /api/* router,
and exposes /api/health.

Run this file with:
    uvicorn app.main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import API_TITLE, API_VERSION, API_DESCRIPTION, CORS_ORIGINS
from app.api import datasets, model, instruments, current, compare

app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description=API_DESCRIPTION,
)

# CORS: allows the React dev server (running on a different port/origin)
# to call this API from the browser. Without this, the browser blocks
# the requests even though the API itself works fine.
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# All feature routers, mounted under /api/*
app.include_router(datasets.router, prefix="/api")
app.include_router(model.router, prefix="/api")
app.include_router(instruments.router, prefix="/api")
app.include_router(current.router, prefix="/api")
app.include_router(compare.router, prefix="/api")


@app.get("/api/health", tags=["Health"])
def health_check():
    """Simple liveness check - used by teammates and deployment checks."""
    return {"status": "ok", "service": "ocean-visualization-backend"}
