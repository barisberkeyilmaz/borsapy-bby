from __future__ import annotations


def test_get_all_indices(client):
    response = client.get("/api/indices/")
    assert response.status_code == 200
    body = response.json()
    assert body[0]["name"] == "XU100"


def test_get_index_info(client):
    response = client.get("/api/indices/XU100")
    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "XU100"


def test_get_index_constituents(client):
    response = client.get("/api/indices/XU100/constituents")
    assert response.status_code == 200
    body = response.json()
    assert body[0]["symbol"] == "AAA"
