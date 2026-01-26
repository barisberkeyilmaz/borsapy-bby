"""Service layer for borsapy integration."""

import sys
from pathlib import Path
from functools import lru_cache
from typing import Dict, List, Optional

# Add parent directory to path to import borsapy from source
borsapy_path = Path(__file__).parent.parent.parent.parent.parent.parent
sys.path.insert(0, str(borsapy_path))

import borsapy as bp


class BorsapyService:
    """Service for interacting with borsapy library."""

    # Template descriptions
    TEMPLATE_DESCRIPTIONS = {
        "small_cap": "Küçük sermayeli şirketler (piyasa değeri < $1B)",
        "mid_cap": "Orta sermayeli şirketler ($1B-$5B)",
        "large_cap": "Büyük sermayeli şirketler (> $5B)",
        "high_dividend": "Yüksek temettü verimi (> 2%)",
        "high_upside": "Yüksek yükseliş potansiyeli",
        "low_upside": "Düşük yükseliş potansiyeli",
        "high_volume": "Yüksek işlem hacmi",
        "low_volume": "Düşük işlem hacmi",
        "buy_recommendation": "AL önerisi olan hisseler",
        "sell_recommendation": "SAT önerisi olan hisseler",
        "high_net_margin": "Yüksek net kar marjı (> 10%)",
        "high_return": "Pozitif haftalık getiri",
        "low_pe": "Düşük F/K oranı",
        "high_roe": "Yüksek özkaynak karlılığı",
        "high_foreign_ownership": "Yüksek yabancı payı",
    }

    def get_screener_templates(self) -> List[dict]:
        """Get available screener templates."""
        return [
            {"name": name, "description": self.TEMPLATE_DESCRIPTIONS.get(name, name)}
            for name in bp.Screener.TEMPLATES
        ]

    def run_template(self, template_name: str) -> dict:
        """Run a screener template."""
        df = bp.screen_stocks(template=template_name)
        results = df.to_dict(orient="records")
        return {
            "results": results,
            "count": len(results),
            "template": template_name,
        }

    def run_custom_screener(
        self,
        filters: Optional[List[dict]] = None,
        sector: Optional[str] = None,
        index: Optional[str] = None,
        recommendation: Optional[str] = None,
    ) -> dict:
        """Run custom screener with filters."""
        screener = bp.Screener()

        if sector:
            screener.set_sector(sector)
        if index:
            screener.set_index(index)
        if recommendation:
            screener.set_recommendation(recommendation)

        if filters:
            for f in filters:
                screener.add_filter(
                    f["criteria"],
                    min=f.get("min"),
                    max=f.get("max"),
                    required=f.get("required", False),
                )

        df = screener.run()
        results = df.to_dict(orient="records")
        return {
            "results": results,
            "count": len(results),
            "template": None,
        }

    def get_criteria(self) -> List[dict]:
        """Get available screener criteria."""
        return bp.screener_criteria()

    def get_sectors(self) -> List[str]:
        """Get available sectors."""
        return bp.sectors()

    def get_indices(self) -> List[str]:
        """Get available indices."""
        return bp.stock_indices()

    def get_stock_info(self, symbol: str) -> dict:
        """Get stock information."""
        ticker = bp.Ticker(symbol)
        info = ticker.info
        fast_info = ticker.fast_info

        return {
            "symbol": symbol,
            "name": info.get("name"),
            "last_price": info.get("last"),
            "change": info.get("change"),
            "change_percent": info.get("change_percent"),
            "open": info.get("open"),
            "high": info.get("high"),
            "low": info.get("low"),
            "close": info.get("close"),
            "volume": info.get("volume"),
            "market_cap": fast_info.market_cap,
            "pe_ratio": fast_info.pe_ratio,
            "pb_ratio": fast_info.pb_ratio,
            "year_high": fast_info.year_high,
            "year_low": fast_info.year_low,
        }

    def get_stock_history(
        self,
        symbol: str,
        period: str = "1mo",
        interval: str = "1d",
    ) -> List[dict]:
        """Get stock price history."""
        ticker = bp.Ticker(symbol)
        df = ticker.history(period=period, interval=interval)

        if df.empty:
            return []

        df = df.reset_index()
        df["Date"] = df["Date"].dt.strftime("%Y-%m-%d")

        return df.to_dict(orient="records")

    def get_stock_fast_info(self, symbol: str) -> dict:
        """Get fast stock info (price focused)."""
        ticker = bp.Ticker(symbol)
        info = ticker.info

        return {
            "symbol": symbol,
            "last_price": info.get("last"),
            "change": info.get("change"),
            "change_percent": info.get("change_percent"),
            "volume": info.get("volume"),
        }

    def get_technicals(self, symbol: str, period: str = "1y") -> dict:
        """Get technical analysis signals with crossover detection."""
        import pandas as pd

        ticker = bp.Ticker(symbol)
        df = ticker.history(period=period)

        if df.empty:
            return {}

        # Calculate indicators
        df = bp.add_indicators(df, ["rsi", "macd", "sma", "ema", "bollinger", "atr", "stochastic"])

        # Reset index to have Date as a column
        df = df.reset_index()

        # Get last values
        last = df.iloc[-1]
        current_price = last.get("Close", 0)

        # Helper to detect crossovers
        def find_crossover(fast_col: str, slow_col: str, lookback: int = 60) -> dict:
            """Find the most recent crossover between two series."""
            if fast_col not in df.columns or slow_col not in df.columns:
                return None

            recent = df.tail(lookback).copy()
            recent["above"] = recent[fast_col] > recent[slow_col]
            recent["cross"] = recent["above"] != recent["above"].shift(1)

            crosses = recent[recent["cross"] == True]
            if crosses.empty:
                return None

            last_cross = crosses.iloc[-1]
            cross_type = "bullish" if last_cross["above"] else "bearish"
            cross_date = last_cross["Date"]

            # Format date
            if isinstance(cross_date, pd.Timestamp):
                cross_date = cross_date.strftime("%Y-%m-%d")

            return {
                "type": cross_type,
                "date": cross_date,
                "days_ago": len(df) - crosses.index[-1] - 1
            }

        # Detect crossovers
        sma_50_200_cross = find_crossover("SMA_50", "SMA_200") if "SMA_200" in df.columns else None
        sma_20_50_cross = find_crossover("SMA_20", "SMA_50")
        macd_cross = find_crossover("MACD", "MACD_Signal")

        # Generate signals
        signals = []

        # RSI signals
        rsi = last.get("RSI")
        if rsi is not None:
            if rsi < 30:
                signals.append({"indicator": "RSI", "signal": "Aşırı satım bölgesinde", "type": "bullish"})
            elif rsi > 70:
                signals.append({"indicator": "RSI", "signal": "Aşırı alım bölgesinde", "type": "bearish"})
            elif rsi < 40:
                signals.append({"indicator": "RSI", "signal": "Satım bölgesine yaklaşıyor", "type": "neutral"})
            elif rsi > 60:
                signals.append({"indicator": "RSI", "signal": "Alım bölgesine yaklaşıyor", "type": "neutral"})

        # MACD signals
        macd_val = last.get("MACD")
        macd_sig = last.get("MACD_Signal")
        if macd_val is not None and macd_sig is not None:
            if macd_val > macd_sig:
                signals.append({"indicator": "MACD", "signal": "Sinyal çizgisinin üstünde (Yükseliş)", "type": "bullish"})
            else:
                signals.append({"indicator": "MACD", "signal": "Sinyal çizgisinin altında (Düşüş)", "type": "bearish"})

        # SMA signals
        sma_20 = last.get("SMA_20")
        sma_50 = last.get("SMA_50")
        sma_200 = last.get("SMA_200") if "SMA_200" in df.columns else None

        if sma_50 and sma_200:
            if sma_50 > sma_200:
                signals.append({"indicator": "SMA 50/200", "signal": "Golden Cross aktif (Uzun vadeli yükseliş)", "type": "bullish"})
            else:
                signals.append({"indicator": "SMA 50/200", "signal": "Death Cross aktif (Uzun vadeli düşüş)", "type": "bearish"})

        if current_price and sma_20:
            if current_price > sma_20:
                signals.append({"indicator": "Fiyat/SMA20", "signal": "Fiyat SMA20 üstünde", "type": "bullish"})
            else:
                signals.append({"indicator": "Fiyat/SMA20", "signal": "Fiyat SMA20 altında", "type": "bearish"})

        # Bollinger signals
        bb_upper = last.get("BB_Upper")
        bb_lower = last.get("BB_Lower")
        if bb_upper and bb_lower and current_price:
            if current_price > bb_upper:
                signals.append({"indicator": "Bollinger", "signal": "Üst banda temas (Aşırı alım)", "type": "bearish"})
            elif current_price < bb_lower:
                signals.append({"indicator": "Bollinger", "signal": "Alt banda temas (Aşırı satım)", "type": "bullish"})

        # Stochastic signals
        stoch_k = last.get("Stoch_K")
        if stoch_k is not None:
            if stoch_k < 20:
                signals.append({"indicator": "Stochastic", "signal": "Aşırı satım bölgesinde", "type": "bullish"})
            elif stoch_k > 80:
                signals.append({"indicator": "Stochastic", "signal": "Aşırı alım bölgesinde", "type": "bearish"})

        return {
            "indicators": {
                "rsi": rsi,
                "macd": macd_val,
                "macd_signal": macd_sig,
                "sma_20": sma_20,
                "sma_50": sma_50,
                "sma_200": sma_200,
                "ema_12": last.get("EMA_12"),
                "ema_26": last.get("EMA_26"),
                "bollinger_upper": bb_upper,
                "bollinger_lower": bb_lower,
                "bollinger_mid": last.get("BB_Mid") if "BB_Mid" in df.columns else None,
                "atr": last.get("ATR"),
                "stoch_k": stoch_k,
                "stoch_d": last.get("Stoch_D"),
            },
            "crossovers": {
                "sma_50_200": sma_50_200_cross,
                "sma_20_50": sma_20_50_cross,
                "macd": macd_cross,
            },
            "signals": signals,
            "current_price": current_price,
        }

    def get_performance(self, symbol: str) -> dict:
        """Get performance metrics over different time periods."""
        ticker = bp.Ticker(symbol)

        periods = {
            "1w": "5d",
            "1m": "1mo",
            "3m": "3mo",
            "6m": "6mo",
            "1y": "1y",
            "ytd": "ytd",
        }

        performance = {}

        for label, period in periods.items():
            try:
                df = ticker.history(period=period)
                if not df.empty and len(df) > 1:
                    start_price = df.iloc[0]["Close"]
                    end_price = df.iloc[-1]["Close"]
                    change_pct = ((end_price - start_price) / start_price) * 100
                    performance[label] = round(change_pct, 2)
                else:
                    performance[label] = None
            except Exception:
                performance[label] = None

        return performance

    def search_stocks(self, query: str) -> List[dict]:
        """Search for stocks."""
        # Use full_info=True to get dicts instead of just symbol strings
        results = bp.search(query, type="stock", exchange="BIST", full_info=True)
        return [
            {"symbol": r.get("symbol", ""), "name": r.get("description", ""), "type": "stock"}
            for r in results
        ]

    def get_all_indices(self) -> List[dict]:
        """Get all BIST indices."""
        indices_data = bp.all_indices()
        return indices_data.to_dict(orient="records") if not indices_data.empty else []

    def get_index_info(self, index_name: str) -> dict:
        """Get index information."""
        idx = bp.Index(index_name)
        info = idx.info
        return info

    def get_index_constituents(self, index_name: str) -> List[dict]:
        """Get index constituents."""
        idx = bp.Index(index_name)
        constituents = idx.constituents
        return constituents.to_dict(orient="records") if not constituents.empty else []

    def get_market_summary(self) -> dict:
        """Get market summary."""
        # Get main indices
        indices = []
        for name in ["XU100", "XU030", "XUSIN", "XUBAN"]:
            try:
                idx = bp.Index(name)
                info = idx.info
                indices.append({
                    "name": name,
                    "value": info.get("last"),
                    "change": info.get("change"),
                    "change_percent": info.get("change_percent"),
                })
            except Exception:
                pass

        return {"indices": indices}

    def run_technical_scan(
        self,
        scan_type: str,
        index: Optional[str] = None,
    ) -> List[dict]:
        """Run technical scanner."""
        scanner = bp.TechnicalScanner()

        if index:
            scanner.set_index(index)

        results = scanner.scan(scan_type)
        return results.to_dict(orient="records") if hasattr(results, "to_dict") else results


@lru_cache()
def get_borsapy_service() -> BorsapyService:
    """Get cached borsapy service instance."""
    return BorsapyService()
