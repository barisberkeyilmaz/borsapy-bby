"""Screener schemas."""

from typing import List, Optional

from pydantic import BaseModel, Field


class FilterCriteria(BaseModel):
    """Filter criteria for screener."""

    criteria: str = Field(..., description="Criteria name (e.g., 'pe', 'market_cap')")
    min: Optional[float] = Field(None, description="Minimum value")
    max: Optional[float] = Field(None, description="Maximum value")
    required: bool = Field(False, description="Whether this filter is required")


class ScreenerRequest(BaseModel):
    """Request body for custom screener."""

    filters: List[FilterCriteria] = Field(default_factory=list, description="List of filters")
    sector: Optional[str] = Field(None, description="Sector filter")
    index: Optional[str] = Field(None, description="Index filter (e.g., 'BIST30')")
    recommendation: Optional[str] = Field(None, description="Recommendation filter (AL, SAT, TUT)")


class ScreenerResult(BaseModel):
    """Single screener result."""

    symbol: str
    name: Optional[str] = None
    price: Optional[float] = None
    change: Optional[float] = None
    change_percent: Optional[float] = None
    volume: Optional[float] = None
    market_cap: Optional[float] = None
    pe: Optional[float] = None
    pb: Optional[float] = None
    dividend_yield: Optional[float] = None
    roe: Optional[float] = None
    net_margin: Optional[float] = None
    upside_potential: Optional[float] = None


class ScreenerResponse(BaseModel):
    """Screener response."""

    results: List[dict]
    count: int
    template: Optional[str] = None


class TemplateInfo(BaseModel):
    """Template information."""

    name: str
    description: str


class CriteriaInfo(BaseModel):
    """Criteria information."""

    id: str
    name: str
    min: Optional[str] = None
    max: Optional[str] = None
