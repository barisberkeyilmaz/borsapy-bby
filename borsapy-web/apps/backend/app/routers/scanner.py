"""Technical Scanner API router."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.services.borsapy_service import BorsapyService, get_borsapy_service

router = APIRouter()


@router.get("/scan")
async def run_scan(
    scan_type: str = Query(..., description="Scan type (e.g., 'bullish', 'bearish', 'volume')"),
    index: Optional[str] = Query(None, description="Filter by index (e.g., 'XU100')"),
    service: BorsapyService = Depends(get_borsapy_service),
):
    """Run a technical scan."""
    try:
        return service.run_technical_scan(scan_type, index=index)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
