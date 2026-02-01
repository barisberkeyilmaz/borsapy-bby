from __future__ import annotations


def test_get_templates(client):
    response = client.get("/api/screener/templates")
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert body[0]["name"] == "small_cap"


def test_run_template_success(client):
    response = client.get("/api/screener/templates/small_cap")
    assert response.status_code == 200
    body = response.json()
    assert body["template"] == "small_cap"
    assert body["count"] == 1


def test_run_template_error(error_client):
    response = error_client.get("/api/screener/templates/bad")
    assert response.status_code == 400


def test_run_custom_screener(client):
    payload = {
        "filters": [{"criteria": "pe", "min": 5, "max": 15, "required": True}],
        "sector": "BANKS",
        "index": "XU100",
        "recommendation": "buy",
    }
    response = client.post("/api/screener/run", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 1
    assert body["template"] is None


def test_get_criteria(client):
    response = client.get("/api/screener/criteria")
    assert response.status_code == 200
    assert response.json()[0]["id"] == "pe"


def test_get_sectors(client):
    response = client.get("/api/screener/sectors")
    assert response.status_code == 200
    assert response.json() == ["BANKS"]


def test_get_indices(client):
    response = client.get("/api/screener/indices")
    assert response.status_code == 200
    assert response.json() == ["XU100"]
