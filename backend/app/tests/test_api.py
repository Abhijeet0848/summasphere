"""
Integration Tests for FastAPI Endpoints
=======================================
"""

import unittest
from backend.app.schemas.summarizer import SummarizeRequest, RougeRequest
from backend.app.services.preprocessing import Preprocessor
from backend.app.services.frequency_summarizer import FrequencySummarizer
from backend.app.services.tfidf_summarizer import TfidfSummarizer
from backend.app.services.hybrid_summarizer import HybridSummarizer
from backend.app.services.ranking import RankingService
from backend.app.services.evaluation import RougeEvaluator


from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


class TestApiIntegration(unittest.TestCase):

    def test_health_endpoint(self):
        response = client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "healthy"})

    def test_summarize_endpoint_post(self):
        payload = {
            "text": "Natural Language Processing enables computers to understand human language. Extractive summarization selects the most salient sentences directly from documents. This avoids hallucination and preserves original factual context.",
            "method": "frequency",
            "num_sentences": 2
        }
        response = client.post("/api/summarize", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("summary", data)
        self.assertEqual(data["method"], "frequency")
        self.assertIn("statistics", data)
        self.assertEqual(data["statistics"]["original_sentence_count"], 3)
        self.assertEqual(data["statistics"]["summary_sentence_count"], 2)
        self.assertGreater(data["statistics"]["original_word_count"], 0)
        self.assertGreater(data["statistics"]["summary_word_count"], 0)
        self.assertIn("compression_ratio", data["statistics"])
        self.assertIn("sentences", data)
        self.assertEqual(len(data["sentences"]), 3)

    def test_summarize_endpoint_validation_error(self):
        # Empty text should fail with 422
        response = client.post("/api/summarize", json={"text": "", "num_sentences": 2})
        self.assertEqual(response.status_code, 422)

    def test_summarize_endpoint_invalid_method(self):
        # Invalid method should fail with 422
        response = client.post("/api/summarize", json={
            "text": "Valid test sentence one. Valid test sentence two.",
            "method": "invalid_method",
            "num_sentences": 1
        })
        self.assertEqual(response.status_code, 422)


    def test_evaluate_rouge_endpoint(self):
        payload = {
            "candidate": "Extractive summarization selects important sentences.",
            "reference": "Extractive summarization selects the most important sentences from text."
        }
        response = client.post("/api/evaluate_rouge", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("rouge_1", data)
        self.assertIn("rouge_2", data)
        self.assertIn("rouge_l", data)

    def test_end_to_end_pipeline_frequency(self):
        text = (
            "Machine learning is transforming textual analysis. "
            "Extractive summarization extracts key sentences directly from source documents. "
            "This approach ensures factual consistency and zero hallucination. "
            "Data preprocessing and tokenization are critical foundational steps."
        )
        cleaned = Preprocessor.clean_text(text)
        sentences = Preprocessor.segment_sentences(cleaned)
        tokens = Preprocessor.tokenize_and_normalize(cleaned)
        weights = FrequencySummarizer.calculate_word_frequencies(tokens)
        scored = FrequencySummarizer.score_sentences(sentences, weights)
        summary, annotated = RankingService.rank_and_select(scored, num_sentences=2)

        self.assertTrue(len(summary) > 0)
        self.assertEqual(len([s for s in annotated if s["selected"]]), 2)

    def test_end_to_end_pipeline_tfidf(self):
        text = (
            "Quantum algorithms manipulate qubits in superposition. "
            "Classical computers process deterministic binary bits. "
            "Quantum supremacy represents a landmark computational milestone."
        )
        cleaned = Preprocessor.clean_text(text)
        sentences = Preprocessor.segment_sentences(cleaned)
        scored = TfidfSummarizer.score_sentences(sentences)
        summary, annotated = RankingService.rank_and_select(scored, num_sentences=1)

        self.assertTrue(len(summary) > 0)
        self.assertEqual(len([s for s in annotated if s["selected"]]), 1)

    def test_end_to_end_pipeline_hybrid(self):
        text = (
            "Global warming threatens arctic ecosystems. "
            "Glacial retreat increases global sea levels. "
            "Renewable energy reduces greenhouse emissions."
        )
        cleaned = Preprocessor.clean_text(text)
        sentences = Preprocessor.segment_sentences(cleaned)
        tokens = Preprocessor.tokenize_and_normalize(cleaned)
        weights = FrequencySummarizer.calculate_word_frequencies(tokens)
        scored = HybridSummarizer.score_sentences(sentences, weights, weight_freq=0.5, weight_tfidf=0.5)
        summary, annotated = RankingService.rank_and_select(scored, num_sentences=2)

        self.assertTrue(len(summary) > 0)
        self.assertEqual(len([s for s in annotated if s["selected"]]), 2)

    def test_rouge_evaluator(self):
        cand = "Natural language processing creates concise summaries."
        ref = "Natural language processing creates concise text summaries."
        scores = RougeEvaluator.evaluate(cand, ref)

        self.assertIn("rouge_1", scores)
        self.assertIn("rouge_2", scores)
    def test_compare_algorithms_endpoint(self):
        payload = {
            "text": (
                "Artificial intelligence accelerates medical diagnostic workflows. "
                "Machine learning algorithms detect anomalies in radiographic scans. "
                "Clinical decision support systems enhance healthcare quality and patient safety."
            ),
            "num_sentences": 2
        }
        response = client.post("/api/compare", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["original_sentence_count"], 3)
        self.assertFalse(data["has_reference"])
        self.assertEqual(len(data["results"]), 3)

        methods = [r["method"] for r in data["results"]]
        self.assertIn("frequency", methods)
        self.assertIn("tfidf", methods)
        self.assertIn("hybrid", methods)

        for r in data["results"]:
            self.assertIn("processing_time_ms", r)
            self.assertIn("summary_word_count", r)
            self.assertIn("compression_ratio", r)
            self.assertIn("average_sentence_score", r)
            self.assertTrue(len(r["summary"]) > 0)
            self.assertIsNone(r["rouge"])

    def test_compare_algorithms_with_reference(self):
        payload = {
            "text": (
                "Artificial intelligence accelerates medical diagnostic workflows. "
                "Machine learning algorithms detect anomalies in radiographic scans. "
                "Clinical decision support systems enhance healthcare quality and patient safety."
            ),
            "num_sentences": 2,
            "reference_summary": "Artificial intelligence and machine learning support medical diagnostic workflows."
        }
        response = client.post("/api/compare", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["has_reference"])
        for r in data["results"]:
            self.assertIsNotNone(r["rouge"])
            self.assertIn("rouge_1", r["rouge"])
            self.assertIn("rouge_2", r["rouge"])
            self.assertIn("rouge_l", r["rouge"])


if __name__ == "__main__":
    unittest.main()


