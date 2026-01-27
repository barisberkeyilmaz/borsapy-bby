"""Technical Scanner API router."""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.services.borsapy_service import BorsapyService, get_borsapy_service

router = APIRouter()


class ScanRequest(BaseModel):
    """Scan request."""

    conditions: List[str] = Field(..., description="List of condition strings")
    universe: str = Field("XU100", description="Index symbol or comma-separated symbols")
    interval: str = Field("1d", description="Timeframe (1d, 1h, 4h, 1W, etc.)")
    limit: int = Field(100, description="Maximum number of results")


class ScanResult(BaseModel):
    """Scan result."""

    results: List[dict]
    count: int
    conditions: List[str]
    universe: str
    interval: str


class ScanPreset(BaseModel):
    """Scan preset."""

    id: str
    name: str
    description: str
    conditions: List[str]
    category: str


class IndicatorInfo(BaseModel):
    """Indicator information."""

    id: str
    name: str
    description: str


class IndicatorCategory(BaseModel):
    """Indicator category."""

    category: str
    indicators: List[IndicatorInfo]


@router.post("/run", response_model=ScanResult)
async def run_scan(
    request: ScanRequest,
    service: BorsapyService = Depends(get_borsapy_service),
):
    """Run a technical scan with multiple conditions."""
    try:
        return service.run_technical_scan(
            conditions=request.conditions,
            universe=request.universe,
            interval=request.interval,
            limit=request.limit,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/presets", response_model=List[ScanPreset])
async def get_presets(
    service: BorsapyService = Depends(get_borsapy_service),
):
    """Get predefined scan presets."""
    try:
        return service.get_scan_presets()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/indicators", response_model=List[IndicatorCategory])
async def get_indicators(
    service: BorsapyService = Depends(get_borsapy_service),
):
    """Get available indicators for scanning."""
    try:
        return service.get_available_indicators()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/universes")
async def get_universes():
    """Get available universes (indices) for scanning."""
    return [
        {"id": "XU030", "name": "BIST 30", "description": "BIST en büyük 30 şirket"},
        {"id": "XU050", "name": "BIST 50", "description": "BIST en büyük 50 şirket"},
        {"id": "XU100", "name": "BIST 100", "description": "BIST en büyük 100 şirket"},
        {"id": "XBANK", "name": "Bankacılık", "description": "Banka hisseleri"},
        {"id": "XHOLD", "name": "Holding", "description": "Holding hisseleri"},
        {"id": "XUSIN", "name": "Sınai", "description": "Sanayi şirketleri"},
        {"id": "XGIDA", "name": "Gıda", "description": "Gıda şirketleri"},
        {"id": "XTEKS", "name": "Tekstil", "description": "Tekstil şirketleri"},
        {"id": "XMANA", "name": "Metal Ana", "description": "Metal ana sanayi"},
        {"id": "XKMYA", "name": "Kimya", "description": "Kimya şirketleri"},
    ]


@router.get("/intervals")
async def get_intervals():
    """Get available timeframe intervals."""
    return [
        {"id": "1m", "name": "1 Dakika", "category": "intraday"},
        {"id": "5m", "name": "5 Dakika", "category": "intraday"},
        {"id": "15m", "name": "15 Dakika", "category": "intraday"},
        {"id": "30m", "name": "30 Dakika", "category": "intraday"},
        {"id": "1h", "name": "1 Saat", "category": "intraday"},
        {"id": "4h", "name": "4 Saat", "category": "intraday"},
        {"id": "1d", "name": "Günlük", "category": "daily"},
        {"id": "1W", "name": "Haftalık", "category": "weekly"},
        {"id": "1M", "name": "Aylık", "category": "monthly"},
    ]
