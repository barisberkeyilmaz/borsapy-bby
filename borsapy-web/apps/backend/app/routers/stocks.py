"""Stocks API router."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query

from app.schemas.stocks import SearchResult, StockHistory, StockInfo, TechnicalSignals
from app.services.borsapy_service import BorsapyService, get_borsapy_service

router = APIRouter()


@router.get("/search", response_model=List[SearchResult])
async def search_stocks(
    q: str = Query(..., min_length=1, description="Search query"),
    service: BorsapyService = Depends(get_borsapy_service),
):
    """Search for stocks by name or symbol."""
    try:
        return service.search_stocks(q)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{symbol}", response_model=StockInfo)
async def get_stock_info(
    symbol: str,
    service: BorsapyService = Depends(get_borsapy_service),
):
    """Get detailed stock information."""
    try:
        return service.get_stock_info(symbol.upper())
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Stock {symbol} not found: {str(e)}")


@router.get("/{symbol}/history")
async def get_stock_history(
    symbol: str,
    period: str = Query("1mo", description="Period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, max"),
    interval: str = Query("1d", description="Interval: 1m, 5m, 15m, 30m, 1h, 1d, 1wk, 1mo"),
    service: BorsapyService = Depends(get_borsapy_service),
):
    """Get historical price data."""
    try:
        return service.get_stock_history(symbol.upper(), period=period, interval=interval)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{symbol}/fast-info")
async def get_fast_info(
    symbol: str,
    service: BorsapyService = Depends(get_borsapy_service),
):
    """Get fast price information (for polling)."""
    try:
        return service.get_stock_fast_info(symbol.upper())
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{symbol}/technicals")
async def get_technicals(
    symbol: str,
    period: str = Query("1y", description="Period for calculation"),
    service: BorsapyService = Depends(get_borsapy_service),
):
    """Get technical analysis with signals and crossovers."""
    try:
        return service.get_technicals(symbol.upper(), period=period)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{symbol}/performance")
async def get_performance(
    symbol: str,
    service: BorsapyService = Depends(get_borsapy_service),
):
    """Get performance over different time periods."""
    try:
        return service.get_performance(symbol.upper())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
