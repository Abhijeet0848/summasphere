"""
Pydantic Validation Schemas for Request & Response Data
======================================================
Defines strict data schemas for API requests, NLP responses, and telemetry statistics.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, field_validator


class SentenceInfo(BaseModel):
    id: int = Field(..., description="1-indexed sentence identifier")
    text: str = Field(..., description="Sentence text content")
    score: float = Field(..., description="Normalized sentence importance score")
    rank: int = Field(..., description="Significance rank (1 = highest score)")
    selected: bool = Field(..., description="Whether this sentence is included in the summary")
    token_count: Optional[int] = Field(default=0, description="Count of meaningful tokens")
    tfidf_score: Optional[float] = Field(default=0.0, description="TF-IDF term importance component score")
    position_score: Optional[float] = Field(default=0.0, description="Document position weight score")
    frequency_score: Optional[float] = Field(default=0.0, description="Word frequency component score")
    length_score: Optional[float] = Field(default=0.0, description="Sentence length optimality score")
    redundancy_score: Optional[float] = Field(default=0.0, description="Redundancy penalty / novelty score")
    final_score: Optional[float] = Field(default=0.0, description="Final combined multi-feature score")
    top_keywords: Optional[List[str]] = Field(default=[], description="Key salient keywords present in this sentence")
    reasons: Optional[List[str]] = Field(default=[], description="Explainable NLP factors for why this sentence was scored")
    raw_tokens: Optional[List[str]] = Field(default=[], description="Tokenization output for this sentence")
    filtered_tokens: Optional[List[str]] = Field(default=[], description="Stop-word removal output")
    lemmas: Optional[List[str]] = Field(default=[], description="Lemmatized token roots")


class PreprocessingMetadata(BaseModel):
    language: Optional[str] = Field(default="en", description="Detected language ('en' for English, 'hi' for Hindi)")
    total_sentences: int = Field(..., description="Total sentences segmented")
    raw_words_count: int = Field(..., description="Word count before stop-word removal")
    clean_words_count: int = Field(..., description="Word count after stop-word removal")
    unique_words_count: int = Field(..., description="Unique vocabulary count")
    avg_sentence_length: float = Field(..., description="Average words per sentence")
    removed_stopwords: List[Dict[str, Any]] = Field(default=[], description="List of removed stop-words with counts")
    lemmatization_pairs: List[Dict[str, str]] = Field(default=[], description="Morphological transformations from inflected words to lemmas")


class SummaryStatistics(BaseModel):
    original_sentence_count: int = Field(..., description="Total sentences segmented in source text")
    summary_sentence_count: int = Field(..., description="Number of sentences extracted in summary")
    original_word_count: int = Field(..., description="Total alphanumeric words in original text")
    summary_word_count: int = Field(..., description="Total alphanumeric words in summary")
    compression_ratio: float = Field(..., description="Ratio of summary words to original words")
    processing_time_ms: float = Field(..., description="NLP pipeline execution latency in milliseconds")


class SummarizeRequest(BaseModel):
    text: str = Field(..., min_length=5, description="Input text or document to summarize")
    method: str = Field(default="frequency", description="Summarization method: 'frequency', 'tfidf', or 'hybrid'")
    num_sentences: int = Field(default=3, ge=1, le=100, description="Target number of sentences in summary")
    weight_frequency: Optional[float] = Field(default=0.5, ge=0.0, le=1.0, description="Hybrid weight for Frequency (0.0 - 1.0)")
    weight_tfidf: Optional[float] = Field(default=0.5, ge=0.0, le=1.0, description="Hybrid weight for TF-IDF (0.0 - 1.0)")
    save_to_history: Optional[bool] = Field(default=True, description="Whether to persist to SQLite history")

    @field_validator("method")
    @classmethod
    def validate_method(cls, v: str) -> str:
        clean = v.lower().strip()
        allowed = {"frequency", "tfidf", "hybrid"}
        if clean not in allowed:
            raise ValueError(f"Invalid summarization method '{v}'. Allowed: {sorted(list(allowed))}")
        return clean

    @field_validator("text")
    @classmethod
    def validate_text(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Input text cannot be empty or whitespace only.")
        if len(v.strip()) < 10:
            raise ValueError("Input text is too short to summarize (minimum 10 characters required).")
        return v.strip()


class SummarizeResponse(BaseModel):
    summary: str
    method: str
    original_text: Optional[str] = Field(default="", description="Sanitized original document text")
    detected_language: Optional[str] = Field(default="en", description="Detected language ('en' for English, 'hi' for Hindi)")
    sentences: List[SentenceInfo]
    word_frequencies: Optional[Dict[str, int]] = Field(default={}, description="Word-level frequency distribution")
    preprocessing_meta: Optional[PreprocessingMetadata] = None
    is_extractive_verified: bool = Field(default=True, description="Programmatic validation that all summary sentences are exact subsets of original text")
    statistics: SummaryStatistics
    # Flat backward-compatibility fields for dashboard widgets
    original_sentence_count: int
    summary_sentence_count: int
    original_word_count: int
    summary_word_count: int
    compression_ratio: float
    processing_time_ms: float



class RougeRequest(BaseModel):
    candidate: str = Field(..., min_length=2, description="Generated system summary")
    reference: str = Field(..., min_length=2, description="Human reference (ground-truth) summary")


class RougeMetric(BaseModel):
    precision: float
    recall: float
    f1: float


class RougeResponse(BaseModel):
    rouge_1: RougeMetric
    rouge_2: RougeMetric
    rouge_l: RougeMetric


class ExtractDocumentResponse(BaseModel):
    filename: str = Field(..., description="Uploaded document filename")
    extension: str = Field(..., description="Detected file extension")
    text: str = Field(..., description="Extracted plain text")
    word_count: int = Field(..., description="Total word count in extracted text")
    sentence_count: int = Field(..., description="Total sentence count in extracted text")
    file_size_bytes: int = Field(..., description="Uploaded file size in bytes")


class CompareRequest(BaseModel):
    text: str = Field(..., min_length=10, description="Input text or document to compare")
    num_sentences: int = Field(default=3, ge=1, le=100, description="Target summary sentence count")
    weight_frequency: Optional[float] = Field(default=0.5, ge=0.0, le=1.0, description="Hybrid frequency weight")
    weight_tfidf: Optional[float] = Field(default=0.5, ge=0.0, le=1.0, description="Hybrid TF-IDF weight")
    reference_summary: Optional[str] = Field(default=None, description="Optional human reference summary for ROUGE evaluation")


class MethodComparisonResult(BaseModel):
    method: str
    method_name: str
    summary: str
    summary_word_count: int
    summary_sentence_count: int
    compression_ratio: float
    processing_time_ms: float
    average_sentence_score: float
    sentences: List[SentenceInfo]
    rouge: Optional[RougeResponse] = None


class CompareResponse(BaseModel):
    original_sentence_count: int
    original_word_count: int
    has_reference: bool
    results: List[MethodComparisonResult]


