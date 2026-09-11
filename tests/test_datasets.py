from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok", "service": "ocean-visualization-backend"}


def test_datasets():
    r = client.get("/api/datasets")
    assert r.status_code == 200
    ids = [d["id"] for d in r.json()["datasets"]]
    assert set(ids) == {"ocean_model", "argo", "glider"}


def test_variables():
    r = client.get("/api/variables")
    assert r.status_code == 200
    ids = [v["id"] for v in r.json()["variables"]]
    assert "temperature" in ids
    assert "salinity" in ids
    assert "current_u" in ids


def test_times():
    r = client.get("/api/times")
    assert r.status_code == 200
    times = r.json()["times"]
    assert len(times) > 0
    assert times[0].endswith("Z")


def test_depths():
    r = client.get("/api/depths")
    assert r.status_code == 200
    depths = r.json()["depths"]
    assert 0.0 in depths
    assert 1000.0 in depths
