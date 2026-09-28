"""
Health Check Endpoint
=====================
"""

from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/api/health")
@router.get("/health")
def health_check():
    """Returns service health status."""
    return {"status": "healthy"}

