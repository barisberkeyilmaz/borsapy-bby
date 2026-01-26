"""Market API router."""

from fastapi import APIRouter, Depends, HTTPException

from app.services.borsapy_service import BorsapyService, get_borsapy_service

router = APIRouter()


@router.get("/summary")
async def get_market_summary(service: BorsapyService = Depends(get_borsapy_service)):
    """Get market summary with main indices."""
    try:
        return service.get_market_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
