"""Service layer for borsapy integration."""

import sys
import time
from pathlib import Path
from functools import lru_cache
from typing import Dict, List, Optional
from cachetools import TTLCache
import threading

# Add parent directory to path to import borsapy from source
borsapy_path = Path(__file__).parent.parent.parent.parent.parent.parent
sys.path.insert(0, str(borsapy_path))

import borsapy as bp

# Thread-safe TTL caches for expensive operations
# Cache stock info for 5 minutes
_stock_info_cache = TTLCache(maxsize=500, ttl=300)
_stock_info_lock = threading.Lock()

# Cache history data for 10 minutes
_history_cache = TTLCache(maxsize=200, ttl=600)
_history_lock = threading.Lock()

# Cache technicals for 5 minutes
_technicals_cache = TTLCache(maxsize=200, ttl=300)
_technicals_lock = threading.Lock()

# Cache screener results for 2 minutes
_screener_cache = TTLCache(maxsize=50, ttl=120)
_screener_lock = threading.Lock()


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
        """Run a screener template with caching."""
        cache_key = f"template_{template_name}"

        with _screener_lock:
            if cache_key in _screener_cache:
                return _screener_cache[cache_key]

        df = bp.screen_stocks(template=template_name)
        results = df.to_dict(orient="records")
        result = {
            "results": results,
            "count": len(results),
            "template": template_name,
        }

        with _screener_lock:
            _screener_cache[cache_key] = result

        return result

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
        """Get stock information with caching."""
        cache_key = f"info_{symbol.upper()}"

        with _stock_info_lock:
            if cache_key in _stock_info_cache:
                return _stock_info_cache[cache_key]

        ticker = bp.Ticker(symbol)
        info = ticker.info
        fast_info = ticker.fast_info

        result = {
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

        with _stock_info_lock:
            _stock_info_cache[cache_key] = result

        return result

    def get_stock_history(
        self,
        symbol: str,
        period: str = "1mo",
        interval: str = "1d",
    ) -> List[dict]:
        """Get stock price history with caching."""
        cache_key = f"history_{symbol.upper()}_{period}_{interval}"

        with _history_lock:
            if cache_key in _history_cache:
                return _history_cache[cache_key]

        ticker = bp.Ticker(symbol)
        df = ticker.history(period=period, interval=interval)

        if df.empty:
            return []

        df = df.reset_index()
        # Use ISO format to include time for intraday intervals
        df["Date"] = df["Date"].dt.strftime("%Y-%m-%dT%H:%M:%S")

        result = df.to_dict(orient="records")

        with _history_lock:
            _history_cache[cache_key] = result

        return result

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
        """Get technical analysis signals with crossover detection (cached)."""
        cache_key = f"technicals_{symbol.upper()}_{period}"

        with _technicals_lock:
            if cache_key in _technicals_cache:
                return _technicals_cache[cache_key]

        import pandas as pd
        import numpy as np

        def to_python(val):
            """Convert numpy types to native Python types for JSON serialization."""
            if val is None or (isinstance(val, float) and np.isnan(val)):
                return None
            if isinstance(val, (np.integer, np.int64, np.int32)):
                return int(val)
            if isinstance(val, (np.floating, np.float64, np.float32)):
                return float(val)
            if isinstance(val, np.ndarray):
                return val.tolist()
            return val

        ticker = bp.Ticker(symbol)
        df = ticker.history(period=period)

        if df.empty:
            return {}

        # Calculate indicators - add base indicators
        df = bp.add_indicators(df, ["rsi", "macd", "sma", "ema", "bollinger", "atr", "stochastic"])

        # Add additional SMA periods (50, 200)
        from borsapy.technical import calculate_sma
        df["SMA_50"] = calculate_sma(df, period=50)
        df["SMA_200"] = calculate_sma(df, period=200)

        # Reset index to have Date as a column
        df = df.reset_index()

        # Get last values
        last = df.iloc[-1]
        current_price = to_python(last.get("Close", 0))

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
                "days_ago": int(len(df) - crosses.index[-1] - 1)
            }

        # Detect crossovers
        sma_50_200_cross = find_crossover("SMA_50", "SMA_200") if "SMA_200" in df.columns else None
        sma_20_50_cross = find_crossover("SMA_20", "SMA_50")
        macd_cross = find_crossover("MACD", "MACD_Signal")

        # Generate signals
        signals = []

        # RSI signals (column name is RSI_14)
        rsi = last.get("RSI_14") or last.get("RSI")
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

        # Calculate price ranges for different periods
        def get_price_range(days: int) -> dict:
            if len(df) < days:
                return None
            period_df = df.tail(days)
            return {
                "low": to_python(period_df["Low"].min()),
                "high": to_python(period_df["High"].max()),
            }

        price_ranges = {
            "7d": get_price_range(7),
            "50d": get_price_range(50),
            "200d": get_price_range(200),
        }

        result = {
            "indicators": {
                "rsi": to_python(rsi),
                "macd": to_python(macd_val),
                "macd_signal": to_python(macd_sig),
                "sma_20": to_python(sma_20),
                "sma_50": to_python(sma_50),
                "sma_200": to_python(sma_200),
                "ema_12": to_python(last.get("EMA_12")),
                "ema_26": to_python(last.get("EMA_26")),
                "bollinger_upper": to_python(bb_upper),
                "bollinger_lower": to_python(bb_lower),
                "bollinger_mid": to_python(last.get("BB_Middle")),
                "atr": to_python(last.get("ATR_14") or last.get("ATR")),
                "stoch_k": to_python(stoch_k),
                "stoch_d": to_python(last.get("Stoch_D")),
            },
            "crossovers": {
                "sma_50_200": sma_50_200_cross,
                "sma_20_50": sma_20_50_cross,
                "macd": macd_cross,
            },
            "signals": signals,
            "current_price": current_price,
            "price_ranges": price_ranges,
        }

        with _technicals_lock:
            _technicals_cache[cache_key] = result

        return result

    def get_performance(self, symbol: str) -> dict:
        """Get performance metrics over different time periods (cached)."""
        cache_key = f"performance_{symbol.upper()}"

        with _stock_info_lock:
            if cache_key in _stock_info_cache:
                return _stock_info_cache[cache_key]

        ticker = bp.Ticker(symbol)

        # Get 1 year of data and calculate all periods from it
        try:
            df = ticker.history(period="1y")
        except Exception:
            return {}

        if df.empty or len(df) < 2:
            return {}

        import pandas as pd
        from datetime import datetime, timedelta

        end_price = df.iloc[-1]["Close"]
        end_date = df.index[-1]

        periods = {
            "1w": 5,
            "1m": 21,
            "3m": 63,
            "6m": 126,
            "1y": 252,
        }

        performance = {}

        for label, days in periods.items():
            try:
                if len(df) >= days:
                    start_price = df.iloc[-days]["Close"]
                    change_pct = ((end_price - start_price) / start_price) * 100
                    performance[label] = round(change_pct, 2)
                else:
                    performance[label] = None
            except Exception:
                performance[label] = None

        # YTD calculation
        try:
            year_start = datetime(end_date.year, 1, 1)
            ytd_df = df[df.index >= year_start]
            if not ytd_df.empty:
                start_price = ytd_df.iloc[0]["Close"]
                change_pct = ((end_price - start_price) / start_price) * 100
                performance["ytd"] = round(change_pct, 2)
            else:
                performance["ytd"] = None
        except Exception:
            performance["ytd"] = None

        with _stock_info_lock:
            _stock_info_cache[cache_key] = performance

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
        conditions: List[str],
        universe: str = "XU100",
        interval: str = "1d",
        limit: int = 100,
    ) -> dict:
        """Run technical scanner with multiple conditions.

        Args:
            conditions: List of condition strings (e.g., ["rsi < 30", "volume > 1M"])
            universe: Index symbol (e.g., "XU030", "XU100") or comma-separated symbols
            interval: Timeframe ("1d", "1h", "4h", "1W", etc.)
            limit: Maximum number of results

        Returns:
            Dict with results, count, conditions, and metadata
        """
        scanner = bp.TechnicalScanner()

        # Set universe
        if "," in universe:
            # Custom symbol list
            symbols = [s.strip().upper() for s in universe.split(",")]
            scanner.set_universe(symbols)
        else:
            scanner.set_universe(universe.upper())

        # Add conditions
        for condition in conditions:
            scanner.add_condition(condition)

        # Set interval
        scanner.set_interval(interval)

        # Run scan
        df = scanner.run(limit=limit)

        if df.empty:
            return {
                "results": [],
                "count": 0,
                "conditions": conditions,
                "universe": universe,
                "interval": interval,
            }

        # Convert to records
        results = df.to_dict(orient="records")

        # Clean up numpy types
        def to_python(val):
            if val is None:
                return None
            if hasattr(val, 'item'):
                return val.item()
            if isinstance(val, list):
                return [to_python(v) for v in val]
            return val

        cleaned_results = []
        for row in results:
            cleaned_row = {k: to_python(v) for k, v in row.items()}
            cleaned_results.append(cleaned_row)

        return {
            "results": cleaned_results,
            "count": len(cleaned_results),
            "conditions": conditions,
            "universe": universe,
            "interval": interval,
        }

    def get_scan_presets(self) -> List[dict]:
        """Get predefined scan presets."""
        return [
            {
                "id": "rsi_oversold",
                "name": "RSI Aşırı Satım",
                "description": "RSI < 30 olan hisseler",
                "conditions": ["rsi < 30"],
                "category": "momentum",
            },
            {
                "id": "rsi_overbought",
                "name": "RSI Aşırı Alım",
                "description": "RSI > 70 olan hisseler",
                "conditions": ["rsi > 70"],
                "category": "momentum",
            },
            {
                "id": "macd_bullish",
                "name": "MACD Boğa Kesişimi",
                "description": "MACD sinyal çizgisinin üzerinde",
                "conditions": ["macd > signal"],
                "category": "trend",
            },
            {
                "id": "macd_bearish",
                "name": "MACD Ayı Kesişimi",
                "description": "MACD sinyal çizgisinin altında",
                "conditions": ["macd < signal"],
                "category": "trend",
            },
            {
                "id": "golden_cross",
                "name": "Altın Kesişim",
                "description": "SMA20 > SMA50 olan hisseler",
                "conditions": ["sma_20 > sma_50"],
                "category": "trend",
            },
            {
                "id": "death_cross",
                "name": "Ölüm Kesişimi",
                "description": "SMA20 < SMA50 olan hisseler",
                "conditions": ["sma_20 < sma_50"],
                "category": "trend",
            },
            {
                "id": "price_above_sma50",
                "name": "Fiyat SMA50 Üstünde",
                "description": "Kapanış fiyatı 50 günlük ortalamanın üzerinde",
                "conditions": ["close > sma_50"],
                "category": "trend",
            },
            {
                "id": "price_below_sma50",
                "name": "Fiyat SMA50 Altında",
                "description": "Kapanış fiyatı 50 günlük ortalamanın altında",
                "conditions": ["close < sma_50"],
                "category": "trend",
            },
            {
                "id": "high_volume",
                "name": "Yüksek Hacim",
                "description": "Hacim > 5M",
                "conditions": ["volume > 5M"],
                "category": "volume",
            },
            {
                "id": "oversold_with_volume",
                "name": "Aşırı Satım + Hacim",
                "description": "RSI < 30 ve yüksek hacim",
                "conditions": ["rsi < 30", "volume > 1M"],
                "category": "combo",
            },
            {
                "id": "bullish_momentum",
                "name": "Boğa Momentum",
                "description": "RSI 50-70 arası ve fiyat SMA50 üstünde",
                "conditions": ["rsi > 50", "rsi < 70", "close > sma_50"],
                "category": "combo",
            },
            {
                "id": "stoch_oversold",
                "name": "Stochastic Aşırı Satım",
                "description": "Stochastic K < 20",
                "conditions": ["stoch_k < 20"],
                "category": "momentum",
            },
            # Swing Trading Presets
            {
                "id": "swing_pullback_sma20",
                "name": "SMA20 Pullback",
                "description": "Yükselen trendde SMA20'ye çekilmiş hisseler",
                "conditions": ["close > sma_50", "close <= sma_20 * 1.02", "close >= sma_20 * 0.98", "rsi > 40", "rsi < 60"],
                "category": "swing",
            },
            {
                "id": "swing_pullback_bb",
                "name": "BB Alt Band Pullback",
                "description": "Bollinger alt bandına temas eden yükseliş trendindeki hisseler",
                "conditions": ["close > sma_50", "close <= bb_lower * 1.01"],
                "category": "swing",
            },
            {
                "id": "swing_breakout",
                "name": "Hacimli Direnç Kırımı",
                "description": "SMA50'yi hacimle kıran hisseler",
                "conditions": ["close > sma_50", "volume > 2M", "change_percent > 3"],
                "category": "swing",
            },
            {
                "id": "swing_momentum",
                "name": "Güçlü Momentum",
                "description": "MACD ve RSI uyumlu momentum hisseleri",
                "conditions": ["macd > signal", "rsi > 50", "rsi < 70", "close > sma_20"],
                "category": "swing",
            },
            {
                "id": "swing_reversal",
                "name": "Momentum Dönüşü",
                "description": "Aşırı satımdan dönüş sinyali veren hisseler",
                "conditions": ["rsi < 35", "stoch_k < 20", "macd > signal"],
                "category": "swing",
            },
        ]

    def get_available_indicators(self) -> List[dict]:
        """Get available indicators for scanning."""
        return [
            {"category": "Fiyat", "indicators": [
                {"id": "close", "name": "Kapanış", "description": "Kapanış fiyatı"},
                {"id": "open", "name": "Açılış", "description": "Açılış fiyatı"},
                {"id": "high", "name": "Yüksek", "description": "Günün en yüksek fiyatı"},
                {"id": "low", "name": "Düşük", "description": "Günün en düşük fiyatı"},
                {"id": "volume", "name": "Hacim", "description": "İşlem hacmi (1M = 1 milyon)"},
                {"id": "change_percent", "name": "Değişim %", "description": "Yüzde değişim"},
            ]},
            {"category": "RSI", "indicators": [
                {"id": "rsi", "name": "RSI (14)", "description": "14 periyot RSI"},
                {"id": "rsi_7", "name": "RSI (7)", "description": "7 periyot RSI"},
            ]},
            {"category": "SMA", "indicators": [
                {"id": "sma_5", "name": "SMA 5", "description": "5 periyot basit hareketli ortalama"},
                {"id": "sma_10", "name": "SMA 10", "description": "10 periyot basit hareketli ortalama"},
                {"id": "sma_20", "name": "SMA 20", "description": "20 periyot basit hareketli ortalama"},
                {"id": "sma_50", "name": "SMA 50", "description": "50 periyot basit hareketli ortalama"},
                {"id": "sma_100", "name": "SMA 100", "description": "100 periyot basit hareketli ortalama"},
                {"id": "sma_200", "name": "SMA 200", "description": "200 periyot basit hareketli ortalama"},
            ]},
            {"category": "EMA", "indicators": [
                {"id": "ema_12", "name": "EMA 12", "description": "12 periyot üssel hareketli ortalama"},
                {"id": "ema_20", "name": "EMA 20", "description": "20 periyot üssel hareketli ortalama"},
                {"id": "ema_26", "name": "EMA 26", "description": "26 periyot üssel hareketli ortalama"},
                {"id": "ema_50", "name": "EMA 50", "description": "50 periyot üssel hareketli ortalama"},
                {"id": "ema_200", "name": "EMA 200", "description": "200 periyot üssel hareketli ortalama"},
            ]},
            {"category": "MACD", "indicators": [
                {"id": "macd", "name": "MACD", "description": "MACD çizgisi"},
                {"id": "signal", "name": "Sinyal", "description": "MACD sinyal çizgisi"},
                {"id": "histogram", "name": "Histogram", "description": "MACD histogram"},
            ]},
            {"category": "Stochastic", "indicators": [
                {"id": "stoch_k", "name": "Stoch %K", "description": "Stochastic K çizgisi"},
                {"id": "stoch_d", "name": "Stoch %D", "description": "Stochastic D çizgisi"},
            ]},
            {"category": "Diğer", "indicators": [
                {"id": "adx", "name": "ADX", "description": "Average Directional Index"},
                {"id": "atr", "name": "ATR", "description": "Average True Range"},
                {"id": "cci", "name": "CCI", "description": "Commodity Channel Index"},
                {"id": "bb_upper", "name": "BB Üst", "description": "Bollinger üst bant"},
                {"id": "bb_middle", "name": "BB Orta", "description": "Bollinger orta bant"},
                {"id": "bb_lower", "name": "BB Alt", "description": "Bollinger alt bant"},
            ]},
        ]


    def calculate_swing_levels(
        self,
        symbol: str,
        entry_price: Optional[float] = None,
        stop_loss_atr: float = 2.0,
        take_profit_atr: float = 3.0,
    ) -> dict:
        """Calculate ATR-based swing trading levels.

        Args:
            symbol: Stock symbol
            entry_price: Custom entry price (defaults to current price)
            stop_loss_atr: ATR multiplier for stop-loss
            take_profit_atr: ATR multiplier for take-profit

        Returns:
            Dict with price levels, ATR info, and support/resistance
        """
        import numpy as np

        def to_python(val):
            """Convert numpy types to native Python types for JSON serialization."""
            if val is None or (isinstance(val, float) and np.isnan(val)):
                return None
            if isinstance(val, (np.integer, np.int64, np.int32)):
                return int(val)
            if isinstance(val, (np.floating, np.float64, np.float32)):
                return float(val)
            return val

        ticker = bp.Ticker(symbol.upper())
        df = ticker.history(period="6mo")

        if df.empty:
            raise ValueError(f"No data found for symbol {symbol}")

        # Calculate ATR
        df = bp.add_indicators(df, ["atr", "bollinger"])
        df = df.reset_index()

        last = df.iloc[-1]
        current_price = to_python(last.get("Close", 0))
        atr = to_python(last.get("ATR_14") or last.get("ATR"))

        # Use entry price or current price
        price = entry_price if entry_price is not None else current_price

        # Calculate ATR-based levels
        atr_levels = None
        if atr and price:
            stop_loss = price - (atr * stop_loss_atr)
            take_profit = price + (atr * take_profit_atr)
            stop_loss_pct = ((price - stop_loss) / price) * 100
            take_profit_pct = ((take_profit - price) / price) * 100
            risk_reward = take_profit_atr / stop_loss_atr if stop_loss_atr > 0 else 0

            atr_levels = {
                "stop_loss": round(stop_loss, 2),
                "stop_loss_percent": round(stop_loss_pct, 2),
                "take_profit": round(take_profit, 2),
                "take_profit_percent": round(take_profit_pct, 2),
                "risk_reward": round(risk_reward, 2),
            }

        # Calculate support and resistance levels using pivot points
        support_levels = []
        resistance_levels = []

        # Use recent price action to identify key levels
        recent_df = df.tail(50)
        if not recent_df.empty:
            # Find local minima (supports)
            lows = recent_df["Low"].values
            for i in range(2, len(lows) - 2):
                if lows[i] < lows[i-1] and lows[i] < lows[i-2] and lows[i] < lows[i+1] and lows[i] < lows[i+2]:
                    support_levels.append(round(float(lows[i]), 2))

            # Find local maxima (resistances)
            highs = recent_df["High"].values
            for i in range(2, len(highs) - 2):
                if highs[i] > highs[i-1] and highs[i] > highs[i-2] and highs[i] > highs[i+1] and highs[i] > highs[i+2]:
                    resistance_levels.append(round(float(highs[i]), 2))

            # Add Bollinger bands as dynamic support/resistance
            bb_lower = to_python(last.get("BB_Lower"))
            bb_upper = to_python(last.get("BB_Upper"))
            if bb_lower and bb_lower not in support_levels:
                support_levels.append(round(bb_lower, 2))
            if bb_upper and bb_upper not in resistance_levels:
                resistance_levels.append(round(bb_upper, 2))

        # Sort and limit to 3 most relevant levels
        support_levels = sorted(set(support_levels), reverse=True)[:3]
        resistance_levels = sorted(set(resistance_levels))[:3]

        return {
            "symbol": symbol.upper(),
            "current_price": current_price,
            "atr": round(atr, 2) if atr else None,
            "atr_levels": atr_levels,
            "support_levels": support_levels,
            "resistance_levels": resistance_levels,
        }

    def get_multiple_stocks_info(self, symbols: List[str]) -> List[dict]:
        """Get info for multiple stocks at once."""
        results = []
        for symbol in symbols:
            try:
                info = self.get_stock_info(symbol.upper())
                results.append(info)
            except Exception:
                # Skip stocks that fail
                pass
        return results

    def get_compare_performance(
        self,
        symbols: List[str],
        period: str = "1y",
    ) -> dict:
        """Get normalized performance data for comparing multiple stocks.

        Returns performance series where all prices are normalized to 100 at start.
        """
        import pandas as pd
        import numpy as np

        result = {
            "symbols": [],
            "dates": [],
            "series": {},
        }

        all_dfs = []
        valid_symbols = []

        for symbol in symbols:
            try:
                ticker = bp.Ticker(symbol.upper())
                df = ticker.history(period=period)
                if not df.empty:
                    df = df.reset_index()
                    df["symbol"] = symbol.upper()
                    all_dfs.append(df)
                    valid_symbols.append(symbol.upper())
            except Exception:
                continue

        if not all_dfs:
            return result

        result["symbols"] = valid_symbols

        # Find common date range
        min_date = max(df["Date"].min() for df in all_dfs)
        max_date = min(df["Date"].max() for df in all_dfs)

        # Normalize and align data
        for symbol, df in zip(valid_symbols, all_dfs):
            df = df[(df["Date"] >= min_date) & (df["Date"] <= max_date)]
            if df.empty:
                continue

            # Normalize to 100 at start
            first_price = df.iloc[0]["Close"]
            df["normalized"] = (df["Close"] / first_price) * 100

            # Format dates
            dates = df["Date"].dt.strftime("%Y-%m-%d").tolist()
            values = df["normalized"].round(2).tolist()

            result["series"][symbol] = {
                "dates": dates,
                "values": values,
            }

        # Use first symbol's dates as reference
        if valid_symbols and valid_symbols[0] in result["series"]:
            result["dates"] = result["series"][valid_symbols[0]]["dates"]

        return result

    def get_sector_comparison(self, symbol: str) -> dict:
        """Get sector comparison data for a stock.

        Returns the stock's metrics compared to sector average.
        """
        import pandas as pd

        try:
            ticker = bp.Ticker(symbol.upper())
            info = ticker.info
            fast_info = ticker.fast_info

            # Try to get sector from info
            sector = info.get("sector")

            if not sector:
                return {
                    "symbol": symbol.upper(),
                    "sector": None,
                    "metrics": {},
                    "sector_stocks": [],
                    "error": "Bu hisse icin sektor bilgisi bulunamadi",
                }

            # Get sector stocks using screener
            try:
                screener = bp.Screener()
                screener.set_sector(sector)
                sector_df = screener.run()
            except Exception:
                # Screener may fail due to API issues - return partial data
                return {
                    "symbol": symbol.upper(),
                    "sector": sector,
                    "metrics": {},
                    "sector_stocks": [],
                    "error": "Sektor verileri su an yuklenemiyor",
                }

            if sector_df is None or sector_df.empty:
                return {
                    "symbol": symbol.upper(),
                    "sector": sector,
                    "metrics": {},
                    "sector_stocks": [],
                    "error": "Sektor verisi bulunamadi",
                }

            # Calculate sector averages
            numeric_cols = sector_df.select_dtypes(include=[float, int]).columns
            sector_avg = sector_df[numeric_cols].mean()

            # Stock values
            stock_data = {
                "pe_ratio": fast_info.pe_ratio,
                "pb_ratio": fast_info.pb_ratio,
                "market_cap": fast_info.market_cap,
            }

            # Build comparison metrics
            metrics = {}
            for key, value in stock_data.items():
                col_name = key.replace("_", " ").title()
                if value is not None and key in sector_avg.index:
                    avg = sector_avg[key]
                    if avg and avg != 0:
                        metrics[key] = {
                            "stock_value": round(value, 2) if value else None,
                            "sector_avg": round(avg, 2) if avg else None,
                            "vs_sector": round(((value - avg) / avg) * 100, 1) if value and avg else None,
                        }

            # Get top stocks in sector for ranking
            sector_stocks = sector_df.head(20).to_dict(orient="records") if not sector_df.empty else []

            return {
                "symbol": symbol.upper(),
                "sector": sector,
                "metrics": metrics,
                "sector_stocks": sector_stocks,
                "stock_count": len(sector_df),
            }

        except Exception as e:
            # Log the actual error for debugging
            print(f"Sector comparison error for {symbol}: {e}")
            return {
                "symbol": symbol.upper(),
                "sector": None,
                "metrics": {},
                "sector_stocks": [],
                "error": "Sektor karsilastirmasi su an yuklenemiyor",
            }


    def get_swing_signals(
        self,
        symbol: str,
        period: str = "6mo",
        interval: str = "1d",
    ) -> dict:
        """Get swing trading signals including S/R levels, buy/sell signals, and trade setup.

        Args:
            symbol: Stock symbol
            period: Historical data period (default 6mo)
            interval: Data interval (default 1d) - e.g., 1m, 5m, 15m, 1h, 1d, 1W

        Returns:
            Dict with levels, signals, and trade_setup
        """
        import pandas as pd
        import numpy as np

        def to_python(val):
            """Convert numpy types to native Python types for JSON serialization."""
            if val is None or (isinstance(val, float) and np.isnan(val)):
                return None
            if isinstance(val, (np.integer, np.int64, np.int32)):
                return int(val)
            if isinstance(val, (np.floating, np.float64, np.float32)):
                return float(val)
            return val

        ticker = bp.Ticker(symbol.upper())
        df = ticker.history(period=period, interval=interval)

        if df.empty:
            raise ValueError(f"No data found for symbol {symbol}")

        # Calculate indicators
        df = bp.add_indicators(df, ["rsi", "macd", "sma", "bollinger", "atr", "stochastic"])
        from borsapy.technical import calculate_sma
        df["SMA_50"] = calculate_sma(df, period=50)
        df["SMA_200"] = calculate_sma(df, period=200)

        df = df.reset_index()

        last = df.iloc[-1]
        current_price = to_python(last.get("Close", 0))
        atr = to_python(last.get("ATR_14") or last.get("ATR"))

        # Calculate support and resistance levels with strength
        levels = []
        recent_df = df.tail(60)

        if not recent_df.empty:
            lows = recent_df["Low"].values
            highs = recent_df["High"].values
            dates = recent_df["Date"].values

            # Find local minima (supports)
            for i in range(2, len(lows) - 2):
                if (lows[i] < lows[i-1] and lows[i] < lows[i-2] and
                    lows[i] < lows[i+1] and lows[i] < lows[i+2]):
                    # Calculate strength based on how many times price touched this level
                    price_level = float(lows[i])
                    strength = 1
                    for j in range(len(lows)):
                        if abs(lows[j] - price_level) / price_level < 0.02:  # Within 2%
                            strength += 1
                    levels.append({
                        "price": round(price_level, 2),
                        "type": "support",
                        "strength": min(strength, 5),
                        "source": "swing_low",
                    })

            # Find local maxima (resistances)
            for i in range(2, len(highs) - 2):
                if (highs[i] > highs[i-1] and highs[i] > highs[i-2] and
                    highs[i] > highs[i+1] and highs[i] > highs[i+2]):
                    price_level = float(highs[i])
                    strength = 1
                    for j in range(len(highs)):
                        if abs(highs[j] - price_level) / price_level < 0.02:
                            strength += 1
                    levels.append({
                        "price": round(price_level, 2),
                        "type": "resistance",
                        "strength": min(strength, 5),
                        "source": "swing_high",
                    })

            # Add Bollinger bands as dynamic levels
            bb_lower = to_python(last.get("BB_Lower"))
            bb_upper = to_python(last.get("BB_Upper"))
            if bb_lower:
                levels.append({
                    "price": round(bb_lower, 2),
                    "type": "support",
                    "strength": 2,
                    "source": "bollinger",
                })
            if bb_upper:
                levels.append({
                    "price": round(bb_upper, 2),
                    "type": "resistance",
                    "strength": 2,
                    "source": "bollinger",
                })

            # Add SMA levels
            sma_50 = to_python(last.get("SMA_50"))
            sma_200 = to_python(last.get("SMA_200"))
            if sma_50 and current_price:
                level_type = "support" if current_price > sma_50 else "resistance"
                levels.append({
                    "price": round(sma_50, 2),
                    "type": level_type,
                    "strength": 3,
                    "source": "sma_50",
                })
            if sma_200 and current_price:
                level_type = "support" if current_price > sma_200 else "resistance"
                levels.append({
                    "price": round(sma_200, 2),
                    "type": level_type,
                    "strength": 4,
                    "source": "sma_200",
                })

        # Remove duplicate levels (within 1% of each other) keeping highest strength
        unique_levels = []
        for level in sorted(levels, key=lambda x: -x["strength"]):
            is_duplicate = False
            for existing in unique_levels:
                if abs(level["price"] - existing["price"]) / existing["price"] < 0.01:
                    is_duplicate = True
                    break
            if not is_duplicate:
                unique_levels.append(level)

        # Limit to top 6 levels (3 support, 3 resistance)
        supports = sorted([l for l in unique_levels if l["type"] == "support"],
                         key=lambda x: -x["strength"])[:3]
        resistances = sorted([l for l in unique_levels if l["type"] == "resistance"],
                            key=lambda x: -x["strength"])[:3]
        levels = supports + resistances

        # Detect buy/sell signals
        signals = []
        lookback = min(120, len(df) - 1)  # Look back up to 120 days

        for i in range(max(1, len(df) - lookback), len(df)):
            row = df.iloc[i]
            prev = df.iloc[i - 1]
            date_val = row["Date"]

            # Format date - use full ISO format to match history API
            if isinstance(date_val, pd.Timestamp):
                date_str = date_val.strftime("%Y-%m-%dT%H:%M:%S")
                time_val = int(date_val.timestamp())
            else:
                ts = pd.Timestamp(date_val)
                date_str = ts.strftime("%Y-%m-%dT%H:%M:%S")
                time_val = int(ts.timestamp())

            price = to_python(row.get("Close", 0))
            rsi = to_python(row.get("RSI_14") or row.get("RSI"))
            prev_rsi = to_python(prev.get("RSI_14") or prev.get("RSI"))
            macd = to_python(row.get("MACD"))
            macd_signal = to_python(row.get("MACD_Signal"))
            prev_macd = to_python(prev.get("MACD"))
            prev_macd_signal = to_python(prev.get("MACD_Signal"))
            bb_lower = to_python(row.get("BB_Lower"))
            bb_upper = to_python(row.get("BB_Upper"))
            stoch_k = to_python(row.get("Stoch_K"))
            prev_stoch_k = to_python(prev.get("Stoch_K"))

            # RSI Reversal BUY: RSI crosses above 30
            if rsi and prev_rsi and prev_rsi < 30 and rsi >= 30:
                signals.append({
                    "date": date_str,
                    "time": time_val,
                    "price": price,
                    "signal_type": "buy",
                    "reason": "RSI asiri satimdan donus",
                    "indicator": "rsi",
                    "strength": "strong" if prev_rsi < 25 else "medium",
                })

            # RSI Reversal SELL: RSI crosses below 70
            if rsi and prev_rsi and prev_rsi > 70 and rsi <= 70:
                signals.append({
                    "date": date_str,
                    "time": time_val,
                    "price": price,
                    "signal_type": "sell",
                    "reason": "RSI asiri alimdan donus",
                    "indicator": "rsi",
                    "strength": "strong" if prev_rsi > 75 else "medium",
                })

            # MACD Crossover BUY
            if (macd and macd_signal and prev_macd and prev_macd_signal and
                prev_macd <= prev_macd_signal and macd > macd_signal):
                signals.append({
                    "date": date_str,
                    "time": time_val,
                    "price": price,
                    "signal_type": "buy",
                    "reason": "MACD yukari kesisimi",
                    "indicator": "macd",
                    "strength": "medium",
                })

            # MACD Crossover SELL
            if (macd and macd_signal and prev_macd and prev_macd_signal and
                prev_macd >= prev_macd_signal and macd < macd_signal):
                signals.append({
                    "date": date_str,
                    "time": time_val,
                    "price": price,
                    "signal_type": "sell",
                    "reason": "MACD asagi kesisimi",
                    "indicator": "macd",
                    "strength": "medium",
                })

            # Bollinger Lower Band Touch BUY
            if bb_lower and price and rsi and price <= bb_lower * 1.01 and rsi < 35:
                signals.append({
                    "date": date_str,
                    "time": time_val,
                    "price": price,
                    "signal_type": "buy",
                    "reason": "Bollinger alt banda temas + dusuk RSI",
                    "indicator": "bollinger",
                    "strength": "strong",
                })

            # Bollinger Upper Band Touch SELL
            if bb_upper and price and rsi and price >= bb_upper * 0.99 and rsi > 65:
                signals.append({
                    "date": date_str,
                    "time": time_val,
                    "price": price,
                    "signal_type": "sell",
                    "reason": "Bollinger ust banda temas + yuksek RSI",
                    "indicator": "bollinger",
                    "strength": "strong",
                })

            # Stochastic Reversal BUY
            if stoch_k and prev_stoch_k and prev_stoch_k < 20 and stoch_k >= 20:
                signals.append({
                    "date": date_str,
                    "time": time_val,
                    "price": price,
                    "signal_type": "buy",
                    "reason": "Stochastic asiri satimdan donus",
                    "indicator": "stochastic",
                    "strength": "medium",
                })

            # Stochastic Reversal SELL
            if stoch_k and prev_stoch_k and prev_stoch_k > 80 and stoch_k <= 80:
                signals.append({
                    "date": date_str,
                    "time": time_val,
                    "price": price,
                    "signal_type": "sell",
                    "reason": "Stochastic asiri alimdan donus",
                    "indicator": "stochastic",
                    "strength": "medium",
                })

        # Build trade setup
        trade_setup = None
        if current_price and atr:
            rsi_val = to_python(last.get("RSI_14") or last.get("RSI"))
            macd_val = to_python(last.get("MACD"))
            macd_sig = to_python(last.get("MACD_Signal"))
            stoch_k_val = to_python(last.get("Stoch_K"))
            bb_lower_val = to_python(last.get("BB_Lower"))
            bb_upper_val = to_python(last.get("BB_Upper"))
            sma_20_val = to_python(last.get("SMA_20"))
            sma_50_val = to_python(last.get("SMA_50"))

            # Determine direction based on signals
            bullish_count = 0
            bearish_count = 0
            reasons = []

            # RSI analysis
            if rsi_val:
                if rsi_val < 35:
                    bullish_count += 2
                    reasons.append(f"RSI asiri satimda ({rsi_val:.0f})")
                elif rsi_val < 45:
                    bullish_count += 1
                    reasons.append(f"RSI dusuk ({rsi_val:.0f})")
                elif rsi_val > 65:
                    bearish_count += 2
                    reasons.append(f"RSI asiri alimda ({rsi_val:.0f})")
                elif rsi_val > 55:
                    bearish_count += 1

            # MACD analysis
            if macd_val and macd_sig:
                if macd_val > macd_sig:
                    bullish_count += 1
                    reasons.append("MACD sinyal uzerinde")
                else:
                    bearish_count += 1

            # Stochastic analysis
            if stoch_k_val:
                if stoch_k_val < 25:
                    bullish_count += 1
                    reasons.append(f"Stochastic asiri satimda ({stoch_k_val:.0f})")
                elif stoch_k_val > 75:
                    bearish_count += 1

            # Price vs SMAs
            if sma_20_val and current_price > sma_20_val:
                bullish_count += 1
                reasons.append("Fiyat SMA20 ustunde")
            elif sma_20_val:
                bearish_count += 1

            if sma_50_val and current_price > sma_50_val:
                bullish_count += 1
            elif sma_50_val:
                bearish_count += 1

            # Bollinger position
            if bb_lower_val and bb_upper_val:
                bb_position = (current_price - bb_lower_val) / (bb_upper_val - bb_lower_val)
                if bb_position < 0.2:
                    bullish_count += 1
                    reasons.append("Bollinger alt bandinda")
                elif bb_position > 0.8:
                    bearish_count += 1
                    reasons.append("Bollinger ust bandinda")

            # Determine setup direction
            if bullish_count >= bearish_count + 2:
                direction = "long"
                stop_loss = current_price - (atr * 2)
                tp1 = current_price + (atr * 1.5)
                tp2 = current_price + (atr * 3)
                tp3 = current_price + (atr * 4.5)
            elif bearish_count >= bullish_count + 2:
                direction = "short"
                stop_loss = current_price + (atr * 2)
                tp1 = current_price - (atr * 1.5)
                tp2 = current_price - (atr * 3)
                tp3 = current_price - (atr * 4.5)
            else:
                direction = "neutral"
                stop_loss = None
                tp1 = None
                tp2 = None
                tp3 = None

            # Find nearest support/resistance for better stop-loss/take-profit
            support_levels_sorted = sorted(
                [l for l in levels if l["type"] == "support" and l["price"] < current_price],
                key=lambda x: x["price"],
                reverse=True
            )
            resistance_levels_sorted = sorted(
                [l for l in levels if l["type"] == "resistance" and l["price"] > current_price],
                key=lambda x: x["price"]
            )

            if direction == "long" and support_levels_sorted:
                # Use nearest support as stop loss
                nearest_support = support_levels_sorted[0]["price"]
                stop_loss = nearest_support * 0.98  # Slightly below support
                reasons.append(f"Destek seviyesi: {nearest_support:.2f}")

            if direction == "long" and resistance_levels_sorted:
                # Use resistance levels as take profits
                if len(resistance_levels_sorted) >= 1:
                    tp1 = resistance_levels_sorted[0]["price"]
                if len(resistance_levels_sorted) >= 2:
                    tp2 = resistance_levels_sorted[1]["price"]
                if len(resistance_levels_sorted) >= 3:
                    tp3 = resistance_levels_sorted[2]["price"]

            if direction != "neutral" and stop_loss and tp1:
                risk = abs(current_price - stop_loss)
                reward = abs(tp1 - current_price)
                risk_reward = round(reward / risk, 2) if risk > 0 else 0

                trade_setup = {
                    "active": True,
                    "direction": direction,
                    "entry_price": round(current_price, 2),
                    "stop_loss": round(stop_loss, 2),
                    "stop_loss_percent": round(((stop_loss - current_price) / current_price) * 100, 1),
                    "take_profit_1": round(tp1, 2) if tp1 else None,
                    "take_profit_2": round(tp2, 2) if tp2 else None,
                    "take_profit_3": round(tp3, 2) if tp3 else None,
                    "risk_reward": risk_reward,
                    "reasons": reasons[:5],  # Limit to 5 reasons
                }
            else:
                trade_setup = {
                    "active": False,
                    "direction": "neutral",
                    "entry_price": round(current_price, 2),
                    "stop_loss": None,
                    "stop_loss_percent": None,
                    "take_profit_1": None,
                    "take_profit_2": None,
                    "take_profit_3": None,
                    "risk_reward": None,
                    "reasons": ["Net sinyal yok - bekleyin"],
                }

        return {
            "symbol": symbol.upper(),
            "current_price": current_price,
            "atr": round(atr, 2) if atr else None,
            "levels": levels,
            "signals": signals,
            "trade_setup": trade_setup,
        }

    def get_analysis_summary(
        self,
        symbol: str,
        period: str = "6mo",
    ) -> dict:
        """Generate a human-readable analysis summary in Turkish.

        Combines all technical indicators and generates a sentiment score
        with an easy-to-understand explanation.

        Args:
            symbol: Stock symbol
            period: Historical data period (default 6mo)

        Returns:
            Dict with sentiment, summary_text, key_points, and warnings
        """
        from datetime import datetime

        # Get technical data
        technicals = self.get_technicals(symbol, period)
        if not technicals:
            return {
                "symbol": symbol.upper(),
                "sentiment": "neutral",
                "sentiment_score": 0,
                "summary_text": f"{symbol.upper()} icin teknik veriler yuklenemedi.",
                "key_points": [],
                "warnings": [],
                "generated_at": datetime.now().isoformat(),
            }

        # Get swing signals for S/R levels
        try:
            swing_signals = self.get_swing_signals(symbol, period)
        except Exception:
            swing_signals = None

        current_price = technicals.get("current_price", 0)
        indicators = technicals.get("indicators", {})

        # Calculate sentiment score (-100 to +100)
        score = 0
        reasons = []
        warnings = []

        # RSI analysis (weight: 25)
        rsi = indicators.get("rsi")
        if rsi is not None:
            if rsi < 30:
                score += 25
                reasons.append(f"RSI {rsi:.0f} - asiri satim bolgesi (AL sinyali)")
            elif rsi < 35:
                score += 15
                reasons.append(f"RSI {rsi:.0f} - asiri satima yakin")
            elif rsi > 70:
                score -= 25
                reasons.append(f"RSI {rsi:.0f} - asiri alim bolgesi (SAT sinyali)")
            elif rsi > 65:
                score -= 15
                reasons.append(f"RSI {rsi:.0f} - asiri alima yakin")
            elif rsi < 45:
                score += 5
                reasons.append(f"RSI {rsi:.0f} - notr, hafif olumlu")
            elif rsi > 55:
                score -= 5

        # MACD analysis (weight: 20)
        macd = indicators.get("macd")
        macd_signal = indicators.get("macd_signal")
        if macd is not None and macd_signal is not None:
            if macd > macd_signal:
                score += 20
                reasons.append("MACD sinyal cizgisinin ustunde (yukselis trendi)")
            else:
                score -= 20
                reasons.append("MACD sinyal cizgisinin altinda (dusus trendi)")

        # Stochastic analysis (weight: 15)
        stoch_k = indicators.get("stoch_k")
        if stoch_k is not None:
            if stoch_k < 20:
                score += 15
                reasons.append(f"Stochastic {stoch_k:.0f} - asiri satim")
            elif stoch_k > 80:
                score -= 15
                reasons.append(f"Stochastic {stoch_k:.0f} - asiri alim")

        # Price vs SMA analysis (weight: 15 each)
        sma_20 = indicators.get("sma_20")
        sma_50 = indicators.get("sma_50")
        sma_200 = indicators.get("sma_200")

        if current_price and sma_20:
            if current_price > sma_20:
                score += 10
                reasons.append("Fiyat 20 gunluk ortalamanin ustunde")
            else:
                score -= 10

        if current_price and sma_50:
            if current_price > sma_50:
                score += 10
                reasons.append("Fiyat 50 gunluk ortalamanin ustunde")
            else:
                score -= 10
                warnings.append("Fiyat 50 gunluk ortalamanin altinda - dikkatli olun")

        if current_price and sma_200:
            if current_price > sma_200:
                score += 15
                reasons.append("Fiyat 200 gunluk ortalamanin ustunde (uzun vadeli yukselis)")
            else:
                score -= 15
                warnings.append("Fiyat 200 gunluk ortalamanin altinda - uzun vadeli dusus trendinde")

        # Golden Cross / Death Cross analysis
        if sma_50 and sma_200:
            if sma_50 > sma_200:
                score += 10
                reasons.append("Golden Cross aktif (SMA50 > SMA200)")
            else:
                score -= 10
                warnings.append("Death Cross aktif (SMA50 < SMA200)")

        # Bollinger Bands analysis (weight: 10)
        bb_lower = indicators.get("bollinger_lower")
        bb_upper = indicators.get("bollinger_upper")
        if bb_lower and bb_upper and current_price:
            bb_position = (current_price - bb_lower) / (bb_upper - bb_lower) if (bb_upper - bb_lower) > 0 else 0.5
            if bb_position < 0.2:
                score += 10
                reasons.append("Fiyat Bollinger alt bandinda (dip olabilir)")
            elif bb_position > 0.8:
                score -= 10
                reasons.append("Fiyat Bollinger ust bandinda (tepe olabilir)")

        # Support/Resistance proximity analysis
        if swing_signals and swing_signals.get("levels"):
            levels = swing_signals["levels"]
            supports = [l for l in levels if l["type"] == "support" and l["price"] < current_price]
            resistances = [l for l in levels if l["type"] == "resistance" and l["price"] > current_price]

            if supports:
                nearest_support = max(supports, key=lambda x: x["price"])
                distance_pct = ((current_price - nearest_support["price"]) / current_price) * 100
                if distance_pct < 3:
                    score += 10
                    reasons.append(f"Destek seviyesine yakin: {nearest_support['price']:.2f} TL (%{distance_pct:.1f} uzakta)")

            if resistances:
                nearest_resistance = min(resistances, key=lambda x: x["price"])
                distance_pct = ((nearest_resistance["price"] - current_price) / current_price) * 100
                if distance_pct < 3:
                    warnings.append(f"Direnc seviyesine yakin: {nearest_resistance['price']:.2f} TL (%{distance_pct:.1f} uzakta)")

        # Determine sentiment
        score = max(-100, min(100, score))  # Clamp to -100, +100

        if score >= 30:
            sentiment = "bullish"
            sentiment_tr = "OLUMLU"
        elif score <= -30:
            sentiment = "bearish"
            sentiment_tr = "OLUMSUZ"
        else:
            sentiment = "neutral"
            sentiment_tr = "NOTR"

        # Generate summary text
        summary_text = f"{symbol.upper()} su an {current_price:.2f} TL seviyesinde. "

        if sentiment == "bullish":
            summary_text += "Teknik gostergeler kisa vadede olumlu gorunuyor. "
            if rsi and rsi < 35:
                summary_text += f"RSI gostergesi {rsi:.0f} seviyesinde, bu fiyatin asiri satildigini ve toparlanma potansiyeli oldugunu isaret ediyor. "
            if macd and macd_signal and macd > macd_signal:
                summary_text += "MACD yukselis trendini destekliyor. "
        elif sentiment == "bearish":
            summary_text += "Teknik gostergeler kisa vadede olumsuz sinyaller veriyor. "
            if rsi and rsi > 65:
                summary_text += f"RSI gostergesi {rsi:.0f} seviyesinde, asiri alim bolgesine yakin. "
            if macd and macd_signal and macd < macd_signal:
                summary_text += "MACD dusus trendini isaret ediyor. "
        else:
            summary_text += "Teknik gostergeler karisik sinyaller veriyor. "
            summary_text += "Net bir yon belli degil, beklemek mantikli olabilir. "

        # Add trade setup info if available
        if swing_signals and swing_signals.get("trade_setup"):
            trade_setup = swing_signals["trade_setup"]
            if trade_setup.get("active") and trade_setup.get("stop_loss"):
                warnings.append(f"Onerilen stop-loss: {trade_setup['stop_loss']:.2f} TL")
                if trade_setup.get("take_profit_1"):
                    warnings.append(f"Ilk hedef: {trade_setup['take_profit_1']:.2f} TL")

        return {
            "symbol": symbol.upper(),
            "sentiment": sentiment,
            "sentiment_score": score,
            "summary_text": summary_text.strip(),
            "key_points": reasons[:6],  # Top 6 reasons
            "warnings": warnings[:4],  # Top 4 warnings
            "generated_at": datetime.now().isoformat(),
        }


@lru_cache()
def get_borsapy_service() -> BorsapyService:
    """Get cached borsapy service instance."""
    return BorsapyService()
