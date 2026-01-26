"""Stock schemas."""

from typing import List, Optional

from pydantic import BaseModel, Field


class StockInfo(BaseModel):
    """Stock information."""

    symbol: str
    name: Optional[str] = None
    last_price: Optional[float] = None
    change: Optional[float] = None
    change_percent: Optional[float] = None
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    close: Optional[float] = None
    volume: Optional[int] = None
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    pb_ratio: Optional[float] = None
    dividend_yield: Optional[float] = None
    year_high: Optional[float] = None
    year_low: Optional[float] = None


class StockHistory(BaseModel):
    """Stock history entry."""

    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class TechnicalIndicators(BaseModel):
    """Technical indicator values."""

    rsi: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    sma_20: Optional[float] = None
    sma_50: Optional[float] = None
    sma_200: Optional[float] = None
    ema_12: Optional[float] = None
    ema_26: Optional[float] = None
    bollinger_upper: Optional[float] = None
    bollinger_lower: Optional[float] = None
    bollinger_mid: Optional[float] = None
    atr: Optional[float] = None
    stoch_k: Optional[float] = None
    stoch_d: Optional[float] = None


class Crossover(BaseModel):
    """Crossover event."""

    type: str  # "bullish" or "bearish"
    date: str
    days_ago: int


class Signal(BaseModel):
    """Technical signal."""

    indicator: str
    signal: str
    type: str  # "bullish", "bearish", "neutral"


class Crossovers(BaseModel):
    """Crossover events."""

    sma_50_200: Optional[Crossover] = None
    sma_20_50: Optional[Crossover] = None
    macd: Optional[Crossover] = None


class TechnicalAnalysis(BaseModel):
    """Full technical analysis response."""

    indicators: TechnicalIndicators
    crossovers: Crossovers
    signals: List[Signal]
    current_price: Optional[float] = None


class Performance(BaseModel):
    """Performance over different periods."""

    one_week: Optional[float] = Field(None, alias="1w")
    one_month: Optional[float] = Field(None, alias="1m")
    three_months: Optional[float] = Field(None, alias="3m")
    six_months: Optional[float] = Field(None, alias="6m")
    one_year: Optional[float] = Field(None, alias="1y")
    ytd: Optional[float] = None

    class Config:
        populate_by_name = True


# Keep old name for backwards compatibility
TechnicalSignals = TechnicalAnalysis


class SearchResult(BaseModel):
    """Search result."""

    symbol: str
    name: str
    type: str = "stock"
