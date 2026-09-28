"""
Unit Tests for Multi-Algorithmic Extractive Text Summarizer
===========================================================
"""

import unittest
from extractive_summarizer import ExtractiveSummarizer


class TestExtractiveSummarizer(unittest.TestCase):

    def setUp(self):
        self.summarizer = ExtractiveSummarizer()

    def test_step1_clean_text(self):
        html_input = "<div><p>Hello <b>World</b>! &nbsp; This is a test.</p></div>"
        cleaned = self.summarizer.clean_text(html_input)
        self.assertNotIn("<p>", cleaned)
        self.assertNotIn("</div>", cleaned)
        self.assertIn("Hello World! This is a test.", cleaned)

    def test_step2_segment_sentences(self):
        text = "First sentence. Second sentence! Third sentence? Fourth sentence."
        sentences = self.summarizer.segment_sentences(text)
        self.assertEqual(len(sentences), 4)

    def test_step3_tokenization_and_normalization(self):
        text = "The quick brown foxes are running quickly and jumping over obstacles."
        tokens = self.summarizer.tokenize_and_normalize(text)
        self.assertNotIn("the", tokens)
        self.assertNotIn("are", tokens)
        self.assertTrue(any(t.startswith("run") for t in tokens))

    def test_step4_calculate_word_frequencies(self):
        words = ["nlp", "model", "nlp", "data", "nlp", "model"]
        weights = self.summarizer.calculate_word_frequencies(words)
        self.assertEqual(weights["nlp"], 1.0)
        self.assertAlmostEqual(weights["model"], 2 / 3, places=4)

    def test_algorithm_frequency(self):
        text = """Natural language processing is a crucial subfield of artificial intelligence.
        Text summarization is an important NLP task. Extractive summarization selects key sentences directly."""
        res = self.summarizer.summarize(text, algorithm="frequency", top_n=2)
        self.assertEqual(len(res["extracted_sentences"]), 2)
        self.assertEqual(res["algorithm"], "frequency")

    def test_algorithm_tfidf(self):
        text = """Machine learning models process vast datasets.
        Deep neural networks excel at vision and speech tasks.
        Text summarization condenses information into key points."""
        res = self.summarizer.summarize(text, algorithm="tfidf", top_n=2)
        self.assertEqual(len(res["extracted_sentences"]), 2)
        self.assertEqual(res["algorithm"], "tfidf")

    def test_algorithm_textrank(self):
        text = """Artificial intelligence is transforming text analysis.
        Text analysis relies on machine learning techniques.
        Machine learning techniques enable automated text summarization.
        Climate change is also an important global topic."""
        res = self.summarizer.summarize(text, algorithm="textrank", top_n=2)
        self.assertEqual(len(res["extracted_sentences"]), 2)
        self.assertEqual(res["algorithm"], "textrank")

    def test_position_weighting(self):
        text = """Introduction sets the main context for the entire document.
        Middle paragraph discusses supporting background details.
        Conclusion provides the final key takeaway and summary."""
        res = self.summarizer.summarize(text, top_n=2, use_position_weight=True)
        self.assertTrue(len(res["extracted_sentences"]) > 0)

    def test_rouge_evaluation(self):
        cand = "Natural language processing creates concise extractive summaries."
        ref = "Natural language processing generates extractive text summaries."
        rouge = self.summarizer.calculate_rouge(cand, ref)
        
        self.assertIn("rouge-1", rouge)
        self.assertIn("rouge-2", rouge)
        self.assertIn("rouge-l", rouge)
        self.assertGreater(rouge["rouge-1"]["f1"], 0.0)
        self.assertGreater(rouge["rouge-l"]["f1"], 0.0)


if __name__ == "__main__":
    unittest.main()
