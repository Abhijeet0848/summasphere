"""
Unit Tests for Frequency, TF-IDF, and Hybrid Summarizers
========================================================
"""

import unittest
from backend.app.services.preprocessing import Preprocessor
from backend.app.services.frequency_summarizer import FrequencySummarizer
from backend.app.services.tfidf_summarizer import TfidfSummarizer
from backend.app.services.hybrid_summarizer import HybridSummarizer


class TestSummarizers(unittest.TestCase):

    def setUp(self):
        self.sample_text = (
            "Natural Language Processing empowers computers to understand language. "
            "Deep learning models achieve high accuracy in NLP tasks. "
            "Text summarization is an essential NLP application for condensing documents. "
            "Extractive summarization selects key existing sentences directly."
        )
        self.sentences = Preprocessor.segment_sentences(self.sample_text)
        self.tokens = Preprocessor.tokenize_and_normalize(self.sample_text)
        self.word_weights = FrequencySummarizer.calculate_word_frequencies(self.tokens)

    def test_frequency_calculation(self):
        words = ["nlp", "model", "nlp", "text", "nlp"]
        weights = FrequencySummarizer.calculate_word_frequencies(words)
        self.assertEqual(weights["nlp"], 1.0)
        self.assertAlmostEqual(weights["model"], 1 / 3, places=3)
        self.assertAlmostEqual(weights["text"], 1 / 3, places=3)

    def test_frequency_scoring(self):
        scored = FrequencySummarizer.score_sentences(self.sentences, self.word_weights)
        self.assertEqual(len(scored), len(self.sentences))
        for item in scored:
            self.assertIn("score", item)
            self.assertIn("id", item)
            self.assertGreaterEqual(item["score"], 0.0)

    def test_tfidf_scoring(self):
        scored = TfidfSummarizer.score_sentences(self.sentences)
        self.assertEqual(len(scored), len(self.sentences))
        for item in scored:
            self.assertIn("score", item)
            self.assertGreaterEqual(item["score"], 0.0)

    def test_hybrid_scoring(self):
        scored = HybridSummarizer.score_sentences(
            self.sentences,
            self.word_weights,
            weight_freq=0.6,
            weight_tfidf=0.4
        )
        self.assertEqual(len(scored), len(self.sentences))
        for item in scored:
            self.assertIn("freq_score", item)
            self.assertIn("tfidf_score", item)
            self.assertIn("score", item)

    def test_frequency_summarize_end_to_end(self):
        summary, annotated = FrequencySummarizer.summarize(self.sample_text, num_sentences=2)
        self.assertTrue(len(summary) > 0)
        self.assertEqual(len([s for s in annotated if s["selected"]]), 2)
        # Check original sentences preserved
        for item in annotated:
            if item["selected"]:
                self.assertIn(item["text"], self.sample_text)

    def test_tfidf_summarize_end_to_end(self):
        summary, annotated = TfidfSummarizer.summarize(self.sample_text, num_sentences=2)
        self.assertTrue(len(summary) > 0)
        self.assertEqual(len([s for s in annotated if s["selected"]]), 2)

    def test_hybrid_summarize_end_to_end(self):
        summary, annotated = HybridSummarizer.summarize(self.sample_text, num_sentences=2, weight_freq=0.7, weight_tfidf=0.3)
        self.assertTrue(len(summary) > 0)
        self.assertEqual(len([s for s in annotated if s["selected"]]), 2)


if __name__ == "__main__":
    unittest.main()

