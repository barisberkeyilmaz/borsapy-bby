from __future__ import annotations


def test_backtest_strategies(client):
    response = client.get("/api/backtest/strategies")
    assert response.status_code == 200
    body = response.json()
    assert any(item["id"] == "rsi" for item in body)


def test_backtest_invalid_strategy(client):
    payload = {
        "symbol": "AAA",
        "strategy": "invalid",
        "period": "1y",
        "initial_capital": 100000,
        "commission": 0.001,
    }
    response = client.post("/api/backtest/run", json=payload)
    assert response.status_code == 400
