"""
NLP Statistics and Metrics Module
=================================
Calculates textual metrics and summarization performance telemetry:
- Original & summary word counts
- Original & summary sentence counts
- Compression ratio (reduction metric)
- Execution processing time (in milliseconds)
"""

import re
from typing import Dict, Any


class StatisticsService:
    """Calculates textual and summarization performance telemetry."""

    @staticmethod
    def count_words(text: str) -> int:
        """
        Counts total alphanumeric word tokens in a given text string.
        """
        if not text:
            return 0
        return len(re.findall(r"\b\w+\b", text))

    @staticmethod
    def calculate_compression_ratio(original_word_count: int, summary_word_count: int) -> float:
        """
        Calculates compression ratio:
            ratio = summary_word_count / original_word_count
            
        Example: If original is 200 words and summary is 50 words, ratio is 0.25 (75% compression).
        """
        if original_word_count == 0:
            return 0.0
        return round(summary_word_count / original_word_count, 4)

    @classmethod
    def compute_summary_stats(
        cls,
        original_text: str,
        summary_text: str,
        original_sentence_count: int,
        summary_sentence_count: int,
        processing_time_ms: float
    ) -> Dict[str, Any]:
        """
        Aggregates complete summarization analytics.
        """
        orig_words = cls.count_words(original_text)
        summary_words = cls.count_words(summary_text)
        comp_ratio = cls.calculate_compression_ratio(orig_words, summary_words)

        return {
            "original_sentence_count": original_sentence_count,
            "summary_sentence_count": summary_sentence_count,
            "original_word_count": orig_words,
            "summary_word_count": summary_words,
            "compression_ratio": comp_ratio,
            "processing_time_ms": round(processing_time_ms, 2)
        }
