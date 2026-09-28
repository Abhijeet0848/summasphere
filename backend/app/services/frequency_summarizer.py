"""
Frequency-Based Extractive Summarization Module
===============================================
Computes sentence importance based on normalized word frequency distributions:
1. Calculates frequencies of preprocessed, non-stop-word lemmas.
2. Normalizes term frequencies:
       norm_freq(word) = freq(word) / max_word_frequency
3. Scores each sentence:
       sentence_raw_score = sum(norm_freq(w) for w in sentence)
4. Normalizes sentence score by length factor (sqrt of token count) to prevent bias towards long sentences:
       sentence_score = sentence_raw_score / sqrt(len(sentence_tokens))
5. Ranks sentences, selects Top-K, and restores original chronological order.
"""

from collections import Counter
from typing import List, Dict, Any, Tuple
from backend.app.services.preprocessing import Preprocessor
from backend.app.services.ranking import RankingService


class FrequencySummarizer:
    """Computes sentence scores using normalized term frequencies."""

    @staticmethod
    def calculate_word_frequencies(tokens: List[str]) -> Dict[str, float]:
        """
        Calculates normalized word frequencies from meaningful tokens:
        normalized_frequency(word) = frequency(word) / maximum_word_frequency
        """
        if not tokens:
            return {}
        counts = Counter(tokens)
        max_freq = max(counts.values()) if counts else 1
        if max_freq == 0:
            return {}
        return {word: count / max_freq for word, count in counts.items()}

    @classmethod
    def score_sentences(
        cls,
        sentences: List[str],
        word_weights: Dict[str, float]
    ) -> List[Dict[str, Any]]:
        """
        Calculates sentence score by summing word weights with length normalization:
        Score(S) = sum(norm_freq(w)) / sqrt(num_meaningful_tokens)
        """
        scored_sentences = []
        for idx, sentence in enumerate(sentences):
            tokens = Preprocessor.tokenize_and_normalize(sentence)
            if not tokens:
                scored_sentences.append({
                    "id": idx + 1,
                    "text": sentence,
                    "score": 0.0,
                    "token_count": 0
                })
                continue

            # Sum of normalized word frequencies (stop-words already excluded in tokenization)
            raw_score = sum(word_weights.get(w, 0.0) for w in tokens)

            # Length normalization (dampening bias towards overly long sentences)
            length_factor = len(tokens) ** 0.5 if len(tokens) > 0 else 1.0
            normalized_score = raw_score / length_factor

            scored_sentences.append({
                "id": idx + 1,
                "text": sentence,
                "score": round(normalized_score, 4),
                "token_count": len(tokens)
            })
        return scored_sentences

    @classmethod
    def summarize(
        cls,
        text: str,
        num_sentences: int = 3
    ) -> Tuple[str, List[Dict[str, Any]]]:
        """
        End-to-end frequency summarization pipeline:
        Preprocess -> Calculate Frequencies -> Score -> Rank -> Select Top-K -> Restore Order.
        """
        preprocessed = Preprocessor.preprocess(text)
        sentences = preprocessed["original_sentences"]
        if not sentences:
            return "", []

        weights = cls.calculate_word_frequencies(preprocessed["tokens"])
        scored = cls.score_sentences(sentences, weights)
        return RankingService.rank_and_select(scored, num_sentences=num_sentences)
