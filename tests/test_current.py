from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

VALID_PARAMS = {"depth": 50, "time": "2026-09-03T12:00:00Z"}


def test_current_valid_request():
    r = client.get("/api/current", params=VALID_PARAMS)
    assert r.status_code == 200
    body = r.json()
    assert len(body["points"]) > 0
    point = body["points"][0]
    for key in ("latitude", "longitude", "u", "v", "speed", "direction"):
        assert key in point


def test_current_invalid_depth():
    params = {**VALID_PARAMS, "depth": 12345}
    r = client.get("/api/current", params=params)
    assert r.status_code == 400


def test_current_invalid_time():
    params = {**VALID_PARAMS, "time": "not-a-timestamp"}
    r = client.get("/api/current", params=params)
    assert r.status_code == 400
