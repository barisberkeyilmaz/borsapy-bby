"""Trading API router for swing trading features."""

from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.services.borsapy_service import BorsapyService, get_borsapy_service

router = APIRouter()


class ATRLevels(BaseModel):
    """ATR-based stop-loss and take-profit levels."""

    stop_loss: float = Field(..., description="Stop-loss price level")
    stop_loss_percent: float = Field(..., description="Stop-loss distance as percentage")
    take_profit: float = Field(..., description="Take-profit price level")
    take_profit_percent: float = Field(..., description="Take-profit distance as percentage")
    risk_reward: float = Field(..., description="Risk/reward ratio")


class PriceLevel(BaseModel):
    """Support or resistance price level."""

    price: float = Field(..., description="Price level")
    type: str = Field(..., description="Level type: support or resistance")
    strength: int = Field(..., description="Strength of the level (1-5)")
    source: str = Field(..., description="Source of the level")


class TradingSignal(BaseModel):
    """Buy or sell signal."""

    date: str = Field(..., description="Signal date")
    time: int = Field(..., description="Unix timestamp")
    price: float = Field(..., description="Price at signal")
    signal_type: str = Field(..., description="Signal type: buy or sell")
    reason: str = Field(..., description="Reason for the signal")
    indicator: str = Field(..., description="Indicator that generated the signal")
    strength: str = Field(..., description="Signal strength: strong or medium")


class TradeSetup(BaseModel):
    """Trade setup recommendation."""

    active: bool = Field(..., description="Whether there is an active setup")
    direction: str = Field(..., description="Trade direction: long, short, or neutral")
    entry_price: float = Field(..., description="Entry price")
    stop_loss: Optional[float] = Field(None, description="Stop-loss price")
    stop_loss_percent: Optional[float] = Field(None, description="Stop-loss as percentage")
    take_profit_1: Optional[float] = Field(None, description="First take-profit target")
    take_profit_2: Optional[float] = Field(None, description="Second take-profit target")
    take_profit_3: Optional[float] = Field(None, description="Third take-profit target")
    risk_reward: Optional[float] = Field(None, description="Risk/reward ratio")
    reasons: List[str] = Field(default_factory=list, description="Reasons for the setup")


class SwingSignals(BaseModel):
    """Swing trading signals response."""

    symbol: str
    current_price: float
    atr: Optional[float] = None
    levels: List[PriceLevel] = Field(default_factory=list)
    signals: List[TradingSignal] = Field(default_factory=list)
    trade_setup: Optional[TradeSetup] = None


class SwingLevels(BaseModel):
    """Swing trading levels response."""

    symbol: str
    current_price: float
    atr: Optional[float] = None
    atr_levels: Optional[ATRLevels] = None
    support_levels: List[float] = Field(default_factory=list)
    resistance_levels: List[float] = Field(default_factory=list)


class AnalysisSummary(BaseModel):
    """Analysis summary response with sentiment and key points."""

    symbol: str
    sentiment: str = Field(..., description="Sentiment: bullish, bearish, or neutral")
    sentiment_score: int = Field(..., description="Sentiment score from -100 to +100")
    summary_text: str = Field(..., description="Human-readable summary in Turkish")
    key_points: List[str] = Field(default_factory=list, description="Key analysis points")
    warnings: List[str] = Field(default_factory=list, description="Warnings and important notes")
    generated_at: str = Field(..., description="ISO timestamp of generation")


@router.get("/{symbol}/swing-levels", response_model=SwingLevels)
async def get_swing_levels(
    symbol: str,
    entry_price: Optional[float] = Query(None, description="Custom entry price (defaults to current price)"),
    stop_loss_atr: float = Query(2.0, description="ATR multiplier for stop-loss"),
    take_profit_atr: float = Query(3.0, description="ATR multiplier for take-profit"),
    service: BorsapyService = Depends(get_borsapy_service),
):
    """
    Calculate ATR-based stop-loss and take-profit levels for swing trading.

    Returns:
        - Current price and ATR value
        - Stop-loss and take-profit levels based on ATR
        - Key support and resistance levels
    """
    try:
        return service.calculate_swing_levels(
            symbol=symbol,
            entry_price=entry_price,
            stop_loss_atr=stop_loss_atr,
            take_profit_atr=take_profit_atr,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{symbol}/swing-signals", response_model=SwingSignals)
async def get_swing_signals(
    symbol: str,
    period: str = Query("6mo", description="Historical data period (e.g., 6mo, 1y)"),
    interval: str = Query("1d", description="Data interval (e.g., 1m, 5m, 15m, 1h, 1d, 1W)"),
    service: BorsapyService = Depends(get_borsapy_service),
):
    """
    Get swing trading signals including support/resistance levels, buy/sell signals,
    and trade setup recommendations.

    Returns:
        - Current price and ATR value
        - Support and resistance levels with strength
        - Historical buy/sell signals
        - Trade setup with entry, stop-loss, and take-profit targets
    """
    try:
        return service.get_swing_signals(
            symbol=symbol,
            period=period,
            interval=interval,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{symbol}/analysis-summary", response_model=AnalysisSummary)
async def get_analysis_summary(
    symbol: str,
    period: str = Query("6mo", description="Historical data period (e.g., 6mo, 1y)"),
    service: BorsapyService = Depends(get_borsapy_service),
):
    """
    Get a human-readable analysis summary in Turkish.

    Combines all technical indicators to generate a sentiment score
    and provides an easy-to-understand explanation for beginners.

    Returns:
        - Sentiment (bullish, bearish, neutral)
        - Sentiment score (-100 to +100)
        - Summary text in Turkish
        - Key points explaining the analysis
        - Warnings and important notes
    """
    try:
        return service.get_analysis_summary(
            symbol=symbol,
            period=period,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
