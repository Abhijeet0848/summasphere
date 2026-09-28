"""
Unit Tests for NLP Statistics and Telemetry Service
===================================================
"""

import unittest
from backend.app.services.statistics import StatisticsService


class TestStatistics(unittest.TestCase):

    def test_word_count(self):
        text = "Natural Language Processing (NLP) provides automatic extractive summarization."
        count = StatisticsService.count_words(text)
        self.assertEqual(count, 8)
        self.assertEqual(StatisticsService.count_words(""), 0)
        self.assertEqual(StatisticsService.count_words(None), 0)

    def test_compression_ratio(self):
        orig = 100
        summary = 30
        ratio = StatisticsService.calculate_compression_ratio(orig, summary)
        self.assertEqual(ratio, 0.3)
        self.assertEqual(StatisticsService.calculate_compression_ratio(0, 30), 0.0)

    def test_compute_summary_stats(self):
        orig_text = "Sentence one. Sentence two. Sentence three. Sentence four."
        summ_text = "Sentence one. Sentence four."
        stats = StatisticsService.compute_summary_stats(
            original_text=orig_text,
            summary_text=summ_text,
            original_sentence_count=4,
            summary_sentence_count=2,
            processing_time_ms=12.5
        )
        self.assertEqual(stats["original_sentence_count"], 4)
        self.assertEqual(stats["summary_sentence_count"], 2)
        self.assertEqual(stats["original_word_count"], 8)
        self.assertEqual(stats["summary_word_count"], 4)
        self.assertEqual(stats["compression_ratio"], 0.5)
        self.assertEqual(stats["processing_time_ms"], 12.5)


if __name__ == "__main__":
    unittest.main()
