"""Screener API router."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException

from app.schemas.screener import (
    CriteriaInfo,
    ScreenerRequest,
    ScreenerResponse,
    TemplateInfo,
)
from app.services.borsapy_service import BorsapyService, get_borsapy_service

router = APIRouter()


@router.get("/templates", response_model=List[TemplateInfo])
async def get_templates(service: BorsapyService = Depends(get_borsapy_service)):
    """Get available screener templates."""
    return service.get_screener_templates()


@router.get("/templates/{template_name}", response_model=ScreenerResponse)
async def run_template(
    template_name: str,
    service: BorsapyService = Depends(get_borsapy_service),
):
    """Run a screener template and return results."""
    try:
        return service.run_template(template_name)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/run", response_model=ScreenerResponse)
async def run_screener(
    request: ScreenerRequest,
    service: BorsapyService = Depends(get_borsapy_service),
):
    """Run custom screener with filters."""
    try:
        filters = [f.dict() for f in request.filters] if request.filters else None
        return service.run_custom_screener(
            filters=filters,
            sector=request.sector,
            index=request.index,
            recommendation=request.recommendation,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/criteria", response_model=List[CriteriaInfo])
async def get_criteria(service: BorsapyService = Depends(get_borsapy_service)):
    """Get available filter criteria."""
    try:
        return service.get_criteria()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sectors", response_model=List[str])
async def get_sectors(service: BorsapyService = Depends(get_borsapy_service)):
    """Get available sectors for filtering."""
    try:
        return service.get_sectors()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/indices", response_model=List[str])
async def get_indices(service: BorsapyService = Depends(get_borsapy_service)):
    """Get available stock indices for filtering."""
    try:
        return service.get_indices()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
