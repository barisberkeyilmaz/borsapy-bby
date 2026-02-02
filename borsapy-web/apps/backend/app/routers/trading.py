"""Trading API router for swing trading features."""

from typing import Optional

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


class SwingLevels(BaseModel):
    """Swing trading levels response."""

    symbol: str
    current_price: float
    atr: Optional[float] = None
    atr_levels: Optional[ATRLevels] = None
    support_levels: list[float] = Field(default_factory=list)
    resistance_levels: list[float] = Field(default_factory=list)


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
