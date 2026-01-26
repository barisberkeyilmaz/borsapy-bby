"""Indices API router."""

from fastapi import APIRouter, Depends, HTTPException

from app.services.borsapy_service import BorsapyService, get_borsapy_service

router = APIRouter()


@router.get("/")
async def get_all_indices(service: BorsapyService = Depends(get_borsapy_service)):
    """Get all BIST indices."""
    try:
        return service.get_all_indices()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{index_name}")
async def get_index_info(
    index_name: str,
    service: BorsapyService = Depends(get_borsapy_service),
):
    """Get index information."""
    try:
        return service.get_index_info(index_name.upper())
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{index_name}/constituents")
async def get_index_constituents(
    index_name: str,
    service: BorsapyService = Depends(get_borsapy_service),
):
    """Get index constituents."""
    try:
        return service.get_index_constituents(index_name.upper())
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
