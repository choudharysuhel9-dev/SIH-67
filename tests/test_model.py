from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

VALID_PARAMS = {"variable": "temperature", "depth": 50, "time": "2026-09-03T12:00:00Z"}


def test_model_valid_request():
    r = client.get("/api/model", params=VALID_PARAMS)
    assert r.status_code == 200
    body = r.json()
    assert body["variable"] == "temperature"
    assert body["unit"] == "°C"
    assert len(body["values"]) == len(body["latitude"])
    assert len(body["values"][0]) == len(body["longitude"])


def test_model_invalid_variable():
    params = {**VALID_PARAMS, "variable": "oxygen2"}
    r = client.get("/api/model", params=params)
    assert r.status_code == 400
    detail = r.json()["detail"]
    assert detail["error"] == "Unsupported variable"
    assert "available_variables" in detail


def test_model_invalid_depth():
    params = {**VALID_PARAMS, "depth": 9999}
    r = client.get("/api/model", params=params)
    assert r.status_code == 400
    assert r.json()["detail"]["error"] == "Invalid depth"


def test_model_invalid_time():
    params = {**VALID_PARAMS, "time": "not-a-timestamp"}
    r = client.get("/api/model", params=params)
    assert r.status_code == 400
    assert r.json()["detail"]["error"] == "Invalid time"


def test_model_missing_required_param():
    r = client.get("/api/model", params={"variable": "temperature", "depth": 50})
    assert r.status_code == 422  # FastAPI's own validation for a missing query param
