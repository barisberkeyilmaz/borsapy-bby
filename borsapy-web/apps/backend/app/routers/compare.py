"""Compare API router for stock comparison functionality."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query

from app.services.borsapy_service import BorsapyService, get_borsapy_service

router = APIRouter()


@router.get("/stocks")
async def compare_stocks(
    symbols: str = Query(..., description="Comma-separated list of stock symbols"),
    service: BorsapyService = Depends(get_borsapy_service),
):
    """Get info for multiple stocks for comparison.

    Example: /api/compare/stocks?symbols=THYAO,GARAN,AKBNK
    """
    try:
        symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]

        if len(symbol_list) < 2:
            raise HTTPException(
                status_code=400,
                detail="At least 2 symbols required for comparison"
            )

        if len(symbol_list) > 10:
            raise HTTPException(
                status_code=400,
                detail="Maximum 10 symbols allowed"
            )

        return service.get_multiple_stocks_info(symbol_list)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/performance")
async def compare_performance(
    symbols: str = Query(..., description="Comma-separated list of stock symbols"),
    period: str = Query("1y", description="Period: 1mo, 3mo, 6mo, 1y, 2y, 5y"),
    service: BorsapyService = Depends(get_borsapy_service),
):
    """Get normalized performance data for multiple stocks.

    Returns performance series where all prices are normalized to 100 at start.
    Useful for comparing relative performance over time.

    Example: /api/compare/performance?symbols=THYAO,GARAN&period=1y
    """
    try:
        symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]

        if len(symbol_list) < 2:
            raise HTTPException(
                status_code=400,
                detail="At least 2 symbols required for comparison"
            )

        if len(symbol_list) > 10:
            raise HTTPException(
                status_code=400,
                detail="Maximum 10 symbols allowed"
            )

        return service.get_compare_performance(symbol_list, period=period)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sector/{symbol}")
async def compare_sector(
    symbol: str,
    service: BorsapyService = Depends(get_borsapy_service),
):
    """Get sector comparison for a stock.

    Returns the stock's metrics compared to sector average.

    Example: /api/compare/sector/THYAO
    """
    try:
        return service.get_sector_comparison(symbol.upper())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
