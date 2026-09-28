"""
History Management API Endpoints (SQLite Persistence)
====================================================
Provides:
- POST /api/history        (Save summarization record)
- GET /api/history         (List recent records)
- GET /api/history/{id}    (Retrieve specific record)
- DELETE /api/history/{id} (Delete specific record)
- DELETE /api/history      (Clear all records)
"""

from typing import List
from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.history import HistoryCreateRequest, HistoryItemResponse
from backend.app.models.database import (
    save_history, get_history, get_history_by_id,
    delete_history_item, clear_all_history
)

router = APIRouter(prefix="/api/history", tags=["History"])


@router.post("", response_model=HistoryItemResponse, status_code=status.HTTP_201_CREATED, summary="Create History Record")
def create_history_record(req: HistoryCreateRequest):
    """Saves a summarization result to SQLite database."""
    try:
        new_id = save_history(
            text=req.original_text,
            summary=req.summary,
            method=req.method,
            original_sentence_count=0,
            summary_sentence_count=req.num_selected_sentences,
            original_word_count=req.original_word_count,
            summary_word_count=req.summary_word_count,
            compression_ratio=req.compression_ratio,
            processing_time_ms=req.processing_time_ms
        )
        record = get_history_by_id(new_id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve newly created history record."
            )
        return record
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while saving history: {str(e)}"
        )


@router.get("", response_model=List[HistoryItemResponse], summary="List All History Records")
def list_history(limit: int = 50):
    """Retrieves recent summarization records from SQLite."""
    try:
        return get_history(limit=limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while retrieving history: {str(e)}"
        )


@router.get("/{record_id}", response_model=HistoryItemResponse, summary="Get Single History Record by ID")
def get_record(record_id: int):
    """Retrieves a single history record by ID."""
    try:
        record = get_history_by_id(record_id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"History record #{record_id} not found."
            )
        return record
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.delete("/{record_id}", summary="Delete History Record by ID")
def delete_record(record_id: int):
    """Deletes a single history record."""
    try:
        success = delete_history_item(record_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"History record #{record_id} not found."
            )
        return {"status": "deleted", "id": record_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while deleting record: {str(e)}"
        )


@router.delete("", summary="Clear All History Records")
def clear_history():
    """Clears all history records."""
    try:
        clear_all_history()
        return {"status": "cleared"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while clearing history: {str(e)}"
        )
