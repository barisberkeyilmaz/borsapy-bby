from __future__ import annotations

from typing import Any, Dict, List

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.borsapy_service import get_borsapy_service


class FakeBorsapyService:
    def get_screener_templates(self) -> List[Dict[str, Any]]:
        return [{"name": "small_cap", "description": "Small cap"}]

    def run_template(self, template_name: str) -> Dict[str, Any]:
        return {"results": [{"symbol": "AAA"}], "count": 1, "template": template_name}

    def run_custom_screener(
        self,
        filters: List[Dict[str, Any]] | None = None,
        sector: str | None = None,
        index: str | None = None,
        recommendation: str | None = None,
    ) -> Dict[str, Any]:
        return {"results": [{"symbol": "AAA"}], "count": 1, "template": None}

    def get_criteria(self) -> List[Dict[str, Any]]:
        return [{"id": "pe", "name": "P/E"}]

    def get_sectors(self) -> List[str]:
        return ["BANKS"]

    def get_indices(self) -> List[str]:
        return ["XU100"]

    def search_stocks(self, query: str) -> List[Dict[str, Any]]:
        return [{"symbol": "AAA", "name": "AAA A.S.", "type": "stock"}]

    def get_stock_info(self, symbol: str) -> Dict[str, Any]:
        return {
            "symbol": symbol,
            "name": "AAA",
            "last_price": 10.0,
            "change": 0.5,
            "change_percent": 5.0,
            "open": 9.5,
            "high": 10.2,
            "low": 9.3,
            "close": 10.0,
            "volume": 1000,
            "market_cap": 1_000_000,
            "pe_ratio": 12.3,
            "pb_ratio": 1.2,
            "year_high": 12.0,
            "year_low": 7.5,
        }

    def get_stock_history(self, symbol: str, period: str = "1mo", interval: str = "1d") -> List[Dict[str, Any]]:
        return [
            {
                "Date": "2024-01-01",
                "Open": 9.5,
                "High": 10.2,
                "Low": 9.3,
                "Close": 10.0,
                "Volume": 1000,
            }
        ]

    def get_stock_fast_info(self, symbol: str) -> Dict[str, Any]:
        return {
            "symbol": symbol,
            "last_price": 10.0,
            "change": 0.5,
            "change_percent": 5.0,
            "volume": 1000,
        }

    def get_technicals(self, symbol: str, period: str = "1y") -> Dict[str, Any]:
        return {
            "indicators": {"rsi": 50},
            "crossovers": {},
            "signals": [],
            "current_price": 10.0,
            "price_ranges": {},
        }

    def get_performance(self, symbol: str) -> Dict[str, Any]:
        return {"1w": 1.0, "1m": 2.0}

    def get_all_indices(self) -> List[Dict[str, Any]]:
        return [{"name": "XU100"}]

    def get_index_info(self, index_name: str) -> Dict[str, Any]:
        return {"name": index_name, "last": 100.0}

    def get_index_constituents(self, index_name: str) -> List[Dict[str, Any]]:
        return [{"symbol": "AAA"}]

    def get_market_summary(self) -> Dict[str, Any]:
        return {"indices": [{"name": "XU100", "value": 100.0, "change": 1.0, "change_percent": 1.0}]}

    def run_technical_scan(
        self,
        conditions: List[str],
        universe: str = "XU100",
        interval: str = "1d",
        limit: int = 100,
    ) -> Dict[str, Any]:
        return {
            "results": [{"symbol": "AAA"}],
            "count": 1,
            "conditions": conditions,
            "universe": universe,
            "interval": interval,
        }

    def get_scan_presets(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": "rsi_oversold",
                "name": "RSI oversold",
                "description": "RSI < 30",
                "conditions": ["rsi < 30"],
                "category": "momentum",
            }
        ]

    def get_available_indicators(self) -> List[Dict[str, Any]]:
        return [
            {
                "category": "RSI",
                "indicators": [
                    {"id": "rsi", "name": "RSI", "description": "Relative strength index"}
                ],
            }
        ]

    def get_multiple_stocks_info(self, symbols: List[str]) -> List[Dict[str, Any]]:
        return [{"symbol": symbol, "name": f"{symbol} A.S."} for symbol in symbols]

    def get_compare_performance(self, symbols: List[str], period: str = "1y") -> Dict[str, Any]:
        return {
            "symbols": symbols,
            "dates": ["2024-01-01"],
            "series": {symbols[0]: {"dates": ["2024-01-01"], "values": [100.0]}},
        }

    def get_sector_comparison(self, symbol: str) -> Dict[str, Any]:
        return {"symbol": symbol, "sector": "TEST", "metrics": {}, "sector_stocks": [], "stock_count": 1}


class ErrorBorsapyService(FakeBorsapyService):
    def get_market_summary(self) -> Dict[str, Any]:
        raise RuntimeError("boom")

    def get_stock_info(self, symbol: str) -> Dict[str, Any]:
        raise RuntimeError("not found")

    def run_template(self, template_name: str) -> Dict[str, Any]:
        raise RuntimeError("bad template")


@pytest.fixture
def client() -> TestClient:
    app.dependency_overrides[get_borsapy_service] = lambda: FakeBorsapyService()
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def error_client() -> TestClient:
    app.dependency_overrides[get_borsapy_service] = lambda: ErrorBorsapyService()
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
