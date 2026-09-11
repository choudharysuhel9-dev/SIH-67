from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_list_instruments():
    r = client.get("/api/instruments")
    assert r.status_code == 200
    assert len(r.json()["instruments"]) >= 4


def test_filter_instruments_by_type():
    r = client.get("/api/instruments", params={"instrument_type": "ARGO"})
    assert r.status_code == 200
    instruments = r.json()["instruments"]
    assert len(instruments) > 0
    assert all(i["instrument_type"] == "ARGO" for i in instruments)


def test_invalid_instrument_type():
    r = client.get("/api/instruments", params={"instrument_type": "DRONE"})
    assert r.status_code == 400
    assert r.json()["detail"]["error"] == "Invalid instrument type"


def test_get_instrument_valid():
    r = client.get("/api/instruments/ARGO-001")
    assert r.status_code == 200
    body = r.json()
    assert body["instrument_id"] == "ARGO-001"
    assert body["instrument_type"] == "ARGO"


def test_get_instrument_invalid_id():
    r = client.get("/api/instruments/DOES-NOT-EXIST")
    assert r.status_code == 404
    assert r.json()["detail"]["error"] == "Instrument not found"


def test_instrument_profile_valid():
    r = client.get("/api/instruments/ARGO-001/profile")
    assert r.status_code == 200
    body = r.json()
    assert len(body["depth"]) == len(body["temperature"]) == len(body["salinity"])


def test_instrument_profile_invalid_id():
    r = client.get("/api/instruments/DOES-NOT-EXIST/profile")
    assert r.status_code == 404
