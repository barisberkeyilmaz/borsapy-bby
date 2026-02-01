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

        return {
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
                    "error": "Sector information not available",
                }

            # Get sector stocks using screener
            screener = bp.Screener()
            screener.set_sector(sector)
            sector_df = screener.run()

            if sector_df.empty:
                return {
                    "symbol": symbol.upper(),
                    "sector": sector,
                    "metrics": {},
                    "sector_stocks": [],
                    "error": "No sector data available",
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
            return {
                "symbol": symbol.upper(),
                "sector": None,
                "metrics": {},
                "sector_stocks": [],
                "error": str(e),
            }


@lru_cache()
def get_borsapy_service() -> BorsapyService:
    """Get cached borsapy service instance."""
    return BorsapyService()
