from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_compare_valid_request():
    r = client.get(
        "/api/compare", params={"instrument_id": "ARGO-001", "variable": "temperature"}
    )
    assert r.status_code == 200
    body = r.json()
    assert body["instrument_id"] == "ARGO-001"
    assert body["variable"] == "temperature"
    assert len(body["depth"]) == len(body["observation"]) == len(body["model"])
    assert set(body["metrics"].keys()) == {"rmse", "mae", "bias"}


def test_compare_invalid_instrument_id():
    r = client.get(
        "/api/compare",
        params={"instrument_id": "DOES-NOT-EXIST", "variable": "temperature"},
    )
    assert r.status_code == 404


def test_compare_unsupported_variable():
    r = client.get(
        "/api/compare", params={"instrument_id": "ARGO-001", "variable": "chlorophyll"}
    )
    assert r.status_code == 400
    assert r.json()["detail"]["error"] == "Unsupported comparison variable"


def test_compare_unknown_variable():
    r = client.get(
        "/api/compare", params={"instrument_id": "ARGO-001", "variable": "oxygen2"}
    )
    assert r.status_code == 400
    assert r.json()["detail"]["error"] == "Unsupported variable"
