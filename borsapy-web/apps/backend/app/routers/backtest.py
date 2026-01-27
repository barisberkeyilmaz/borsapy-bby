"""Backtest API router."""

from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.services.borsapy_service import BorsapyService, get_borsapy_service

router = APIRouter()


# Predefined strategy functions
def rsi_strategy(candle: dict, position: Optional[str], indicators: dict) -> Optional[str]:
    """RSI oversold/overbought strategy."""
    rsi = indicators.get("rsi", 50)
    oversold = 30
    overbought = 70

    if rsi < oversold and position is None:
        return "BUY"
    elif rsi > overbought and position == "long":
        return "SELL"
    return "HOLD"


def macd_crossover_strategy(candle: dict, position: Optional[str], indicators: dict) -> Optional[str]:
    """MACD crossover strategy."""
    macd = indicators.get("macd", 0)
    signal = indicators.get("macd_signal", 0)

    if macd > signal and position is None:
        return "BUY"
    elif macd < signal and position == "long":
        return "SELL"
    return "HOLD"


def sma_crossover_strategy(candle: dict, position: Optional[str], indicators: dict) -> Optional[str]:
    """SMA 20/50 crossover strategy (Golden Cross / Death Cross)."""
    sma_20 = indicators.get("sma_20", 0)
    sma_50 = indicators.get("sma_50", 0)

    if sma_20 > sma_50 and position is None:
        return "BUY"
    elif sma_20 < sma_50 and position == "long":
        return "SELL"
    return "HOLD"


def bollinger_breakout_strategy(candle: dict, position: Optional[str], indicators: dict) -> Optional[str]:
    """Bollinger Bands breakout strategy."""
    close = candle.get("close", 0)
    bb_lower = indicators.get("bb_lower", 0)
    bb_upper = indicators.get("bb_upper", float("inf"))
    bb_middle = indicators.get("bb_middle", 0)

    if close < bb_lower and position is None:
        return "BUY"
    elif close > bb_upper and position == "long":
        return "SELL"
    elif close > bb_middle and position == "long":
        # Alternative: exit when price crosses middle band
        pass
    return "HOLD"


# Strategy registry
STRATEGIES = {
    "rsi": {
        "name": "RSI Strategy",
        "description": "RSI 30/70 seviyelerinde alım/satım",
        "function": rsi_strategy,
        "indicators": ["rsi"],
    },
    "macd": {
        "name": "MACD Crossover",
        "description": "MACD ve sinyal çizgisi kesişimi",
        "function": macd_crossover_strategy,
        "indicators": ["macd"],
    },
    "sma_cross": {
        "name": "SMA Crossover",
        "description": "SMA 20/50 Golden Cross / Death Cross",
        "function": sma_crossover_strategy,
        "indicators": ["sma_20", "sma_50"],
    },
    "bollinger": {
        "name": "Bollinger Breakout",
        "description": "Bollinger Bandı kırılımı",
        "function": bollinger_breakout_strategy,
        "indicators": ["bollinger"],
    },
}


class BacktestRequest(BaseModel):
    """Backtest request."""

    symbol: str = Field(..., description="Stock symbol")
    strategy: str = Field(..., description="Strategy type (rsi, macd, sma_cross, bollinger)")
    period: str = Field("1y", description="Backtest period")
    initial_capital: float = Field(100000, description="Initial capital")
    commission: float = Field(0.001, description="Commission rate (0.1%)")


class TradeInfo(BaseModel):
    """Trade information."""

    entry_time: Optional[str] = None
    entry_price: Optional[float] = None
    exit_time: Optional[str] = None
    exit_price: Optional[float] = None
    side: str = "long"
    shares: float = 0.0
    profit: Optional[float] = None
    profit_pct: Optional[float] = None
    entry_indicators: Dict[str, Any] = {}
    exit_indicators: Dict[str, Any] = {}
    entry_reason: str = ""
    exit_reason: str = ""


class BacktestResult(BaseModel):
    """Backtest result."""

    symbol: str
    strategy_name: str
    period: str
    initial_capital: float
    final_equity: Optional[float] = None
    net_profit: Optional[float] = None
    net_profit_pct: Optional[float] = None
    total_trades: Optional[int] = None
    winning_trades: Optional[int] = None
    losing_trades: Optional[int] = None
    win_rate: Optional[float] = None
    profit_factor: Optional[float] = None
    max_drawdown: Optional[float] = None
    sharpe_ratio: Optional[float] = None
    sortino_ratio: Optional[float] = None
    buy_hold_return: Optional[float] = None
    vs_buy_hold: Optional[float] = None
    trades: List[TradeInfo] = []
    equity_curve: List[Dict[str, Any]] = []


class StrategyInfo(BaseModel):
    """Strategy information."""

    id: str
    name: str
    description: str


@router.get("/strategies", response_model=List[StrategyInfo])
async def get_strategies():
    """Get available backtest strategies."""
    return [
        StrategyInfo(id=key, name=val["name"], description=val["description"])
        for key, val in STRATEGIES.items()
    ]


@router.post("/run", response_model=BacktestResult)
async def run_backtest(
    request: BacktestRequest,
    service: BorsapyService = Depends(get_borsapy_service),
):
    """Run a backtest with predefined strategies."""
    try:
        # Validate strategy
        if request.strategy not in STRATEGIES:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown strategy: {request.strategy}. Available: {list(STRATEGIES.keys())}"
            )

        strategy_config = STRATEGIES[request.strategy]
        strategy_func = strategy_config["function"]
        indicators = strategy_config["indicators"]

        # Import backtest module
        import sys
        from pathlib import Path
        borsapy_path = Path(__file__).parent.parent.parent.parent.parent.parent
        sys.path.insert(0, str(borsapy_path))

        from borsapy.backtest import Backtest

        # Create and run backtest
        bt = Backtest(
            symbol=request.symbol,
            strategy=strategy_func,
            period=request.period,
            interval="1d",
            capital=request.initial_capital,
            commission=request.commission,
            indicators=indicators,
        )

        result = bt.run()

        # Convert trades to serializable format
        trades = []
        for trade in result.trades:
            # Convert numpy types in indicators to Python types
            entry_ind = {k: float(v) if hasattr(v, 'item') else v for k, v in trade.entry_indicators.items()}
            exit_ind = {k: float(v) if hasattr(v, 'item') else v for k, v in trade.exit_indicators.items()}

            trades.append(TradeInfo(
                entry_time=trade.entry_time.isoformat() if trade.entry_time else None,
                entry_price=trade.entry_price,
                exit_time=trade.exit_time.isoformat() if trade.exit_time else None,
                exit_price=trade.exit_price,
                side=trade.side,
                shares=trade.shares,
                profit=trade.profit,
                profit_pct=trade.profit_pct,
                entry_indicators=entry_ind,
                exit_indicators=exit_ind,
                entry_reason=trade.entry_reason,
                exit_reason=trade.exit_reason,
            ))

        # Convert equity curve to serializable format
        equity_curve = []
        if not result.equity_curve.empty:
            for date, value in result.equity_curve.items():
                equity_curve.append({
                    "date": date.isoformat() if hasattr(date, "isoformat") else str(date),
                    "equity": float(value),
                })

        return BacktestResult(
            symbol=result.symbol,
            strategy_name=strategy_config["name"],
            period=result.period,
            initial_capital=result.initial_capital,
            final_equity=result.final_equity,
            net_profit=result.net_profit,
            net_profit_pct=result.net_profit_pct,
            total_trades=result.total_trades,
            winning_trades=result.winning_trades,
            losing_trades=result.losing_trades,
            win_rate=result.win_rate,
            profit_factor=result.profit_factor if result.profit_factor != float("inf") else None,
            max_drawdown=result.max_drawdown,
            sharpe_ratio=result.sharpe_ratio if not (result.sharpe_ratio != result.sharpe_ratio) else None,  # Handle NaN
            sortino_ratio=result.sortino_ratio if not (result.sortino_ratio != result.sortino_ratio) and result.sortino_ratio != float("inf") else None,
            buy_hold_return=result.buy_hold_return,
            vs_buy_hold=result.vs_buy_hold,
            trades=trades,
            equity_curve=equity_curve,
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backtest error: {str(e)}")
