"""
Unit Tests for Preprocessing Service
====================================
"""

import unittest
from backend.app.services.preprocessing import Preprocessor


class TestPreprocessing(unittest.TestCase):

    def test_clean_text_html_removal(self):
        raw = "<div><p>Natural Language Processing <b>(NLP)</b> &amp; text analysis.</p></div>"
        cleaned = Preprocessor.clean_text(raw)
        self.assertNotIn("<p>", cleaned)
        self.assertNotIn("</div>", cleaned)
        self.assertIn("Natural Language Processing (NLP) & text analysis.", cleaned)

    def test_clean_text_empty_and_whitespace(self):
        self.assertEqual(Preprocessor.clean_text(""), "")
        self.assertEqual(Preprocessor.clean_text(None), "")
        raw = "   Multiple   \n\n\t spaces and \r\n line breaks.   "
        self.assertEqual(Preprocessor.clean_text(raw), "Multiple spaces and line breaks.")

    def test_segment_sentences(self):
        text = "This is sentence one. Sentence two is here! Is this sentence three? Yes, it is."
        sentences = Preprocessor.segment_sentences(text)
        self.assertEqual(len(sentences), 4)
        self.assertEqual(sentences[0], "This is sentence one.")
        self.assertEqual(sentences[1], "Sentence two is here!")
        self.assertEqual(sentences[2], "Is this sentence three?")
        self.assertEqual(sentences[3], "Yes, it is.")

    def test_tokenize_and_normalize(self):
        text = "The artificial intelligence algorithms are running quickly and analyzing documents."
        tokens = Preprocessor.tokenize_and_normalize(text)
        # Check stop-words are eliminated
        self.assertNotIn("the", tokens)
        self.assertNotIn("are", tokens)
        self.assertNotIn("and", tokens)
        # Check normalization / lemmatization
        self.assertTrue(any(t.startswith("run") for t in tokens))
        self.assertTrue(any(t.startswith("analyz") for t in tokens))
        self.assertTrue(any(t.startswith("algorithm") for t in tokens))

    def test_preprocess_structured_output(self):
        raw = "<p>Quantum computers use qubits. Classical systems use binary bits.</p>"
        result = Preprocessor.preprocess(raw)
        self.assertIn("original_sentences", result)
        self.assertIn("processed_sentences", result)
        self.assertIn("tokens", result)
        self.assertEqual(len(result["original_sentences"]), 2)
        self.assertEqual(len(result["processed_sentences"]), 2)
        self.assertEqual(result["processed_sentences"][0]["id"], 1)
        self.assertEqual(result["processed_sentences"][1]["id"], 2)
        self.assertEqual(result["processed_sentences"][0]["original_text"], "Quantum computers use qubits.")


if __name__ == "__main__":
    unittest.main()

