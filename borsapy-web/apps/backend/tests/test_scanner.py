from __future__ import annotations


def test_run_scan(client):
    payload = {
        "conditions": ["rsi < 30"],
        "universe": "XU100",
        "interval": "1d",
        "limit": 10,
    }
    response = client.post("/api/scanner/run", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 1
    assert body["conditions"] == ["rsi < 30"]


def test_get_presets(client):
    response = client.get("/api/scanner/presets")
    assert response.status_code == 200
    body = response.json()
    assert body[0]["id"] == "rsi_oversold"


def test_get_indicators(client):
    response = client.get("/api/scanner/indicators")
    assert response.status_code == 200
    body = response.json()
    assert body[0]["category"] == "RSI"


def test_get_universes(client):
    response = client.get("/api/scanner/universes")
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert body[0]["id"]


def test_get_intervals(client):
    response = client.get("/api/scanner/intervals")
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert body[0]["id"]
