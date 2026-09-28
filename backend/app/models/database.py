"""
Database Layer (SQLite) for Summarization History Storage
=========================================================
Provides optional persistence for summarized documents, telemetry, and metadata.
"""

import sqlite3
import os
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "summarizer.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initializes the SQLite schema with all required history fields."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS summarization_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                original_text TEXT NOT NULL,
                summary TEXT NOT NULL,
                method TEXT NOT NULL,
                num_selected_sentences INTEGER NOT NULL,
                original_word_count INTEGER NOT NULL,
                summary_word_count INTEGER NOT NULL,
                compression_ratio REAL NOT NULL,
                processing_time_ms REAL NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()


def save_history(
    text: str,
    summary: str,
    method: str,
    original_sentence_count: int,
    summary_sentence_count: int,
    original_word_count: int,
    summary_word_count: int,
    compression_ratio: float,
    processing_time_ms: float
) -> int:
    """Saves a summarization record into SQLite history."""
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO summarization_history (
                original_text, summary, method,
                num_selected_sentences,
                original_word_count, summary_word_count,
                compression_ratio, processing_time_ms
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            text, summary, method,
            summary_sentence_count,
            original_word_count, summary_word_count,
            compression_ratio, processing_time_ms
        ))
        conn.commit()
        return cursor.lastrowid


def get_history(limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieves recent summarization records."""
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, original_text, summary, method,
                   num_selected_sentences, original_word_count, summary_word_count,
                   compression_ratio, processing_time_ms, created_at
            FROM summarization_history
            ORDER BY id DESC
            LIMIT ?
        """, (limit,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def get_history_by_id(record_id: int) -> Optional[Dict[str, Any]]:
    """Retrieves a single summarization record by primary key."""
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, original_text, summary, method,
                   num_selected_sentences, original_word_count, summary_word_count,
                   compression_ratio, processing_time_ms, created_at
            FROM summarization_history
            WHERE id = ?
        """, (record_id,))
        row = cursor.fetchone()
        return dict(row) if row else None


def delete_history_item(record_id: int) -> bool:
    """Deletes a specific history record."""
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM summarization_history WHERE id = ?", (record_id,))
        conn.commit()
        return cursor.rowcount > 0


def clear_all_history() -> bool:
    """Clears all history records."""
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM summarization_history")
        conn.commit()
        return True
