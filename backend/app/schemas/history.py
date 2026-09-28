"""
Pydantic Validation Schemas for History Storage
===============================================
"""

from typing import Optional
from pydantic import BaseModel, Field


class HistoryCreateRequest(BaseModel):
    original_text: str = Field(..., min_length=5, description="Original unsummarized document text")
    summary: str = Field(..., min_length=2, description="Generated extractive summary")
    method: str = Field(default="frequency", description="Summarization method used")
    num_selected_sentences: int = Field(default=1, ge=1, description="Number of extracted sentences")
    original_word_count: int = Field(..., ge=0, description="Word count of original text")
    summary_word_count: int = Field(..., ge=0, description="Word count of summary")
    compression_ratio: float = Field(..., ge=0.0, le=1.0, description="Compression ratio")
    processing_time_ms: float = Field(..., ge=0.0, description="Processing duration in milliseconds")


class HistoryItemResponse(BaseModel):
    id: int
    original_text: str
    summary: str
    method: str
    num_selected_sentences: int
    original_word_count: int
    summary_word_count: int
    compression_ratio: float
    processing_time_ms: float
    created_at: str
