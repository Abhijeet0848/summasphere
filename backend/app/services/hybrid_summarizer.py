"""
Hybrid Extractive Summarization Module
======================================
Combines Frequency and TF-IDF scoring metrics using configurable linear weights:
    Score_hybrid(s) = (alpha * Score_freq_norm(s)) + (beta * Score_tfidf_norm(s))

Where:
- alpha (default 0.5): Weight assigned to word frequency dominance
- beta  (default 0.5): Weight assigned to TF-IDF term uniqueness
"""

from typing import List, Dict, Any, Tuple
from backend.app.services.preprocessing import Preprocessor
from backend.app.services.frequency_summarizer import FrequencySummarizer
from backend.app.services.tfidf_summarizer import TfidfSummarizer
from backend.app.services.ranking import RankingService


class HybridSummarizer:
    """Combines normalized term frequency and TF-IDF sentence scores."""

    @staticmethod
    def score_sentences(
        sentences: List[str],
        word_weights: Dict[str, float],
        weight_freq: float = 0.5,
        weight_tfidf: float = 0.5
    ) -> List[Dict[str, Any]]:
        """
        Calculates hybrid score for each sentence:
        1. Obtains frequency-based scores.
        2. Obtains TF-IDF scores.
        3. Scales both score distributions to [0, 1].
        4. Computes weighted sum: alpha * norm_freq + beta * norm_tfidf.
        """
        if not sentences:
            return []

        freq_scored = FrequencySummarizer.score_sentences(sentences, word_weights)
        tfidf_scored = TfidfSummarizer.score_sentences(sentences)

        # Find maximum scores for min-max / relative scaling
        max_freq_score = max((s["score"] for s in freq_scored), default=1.0) or 1.0
        max_tfidf_score = max((s["score"] for s in tfidf_scored), default=1.0) or 1.0

        hybrid_scored = []
        for i in range(len(sentences)):
            norm_f = freq_scored[i]["score"] / max_freq_score
            norm_t = tfidf_scored[i]["score"] / max_tfidf_score

            combined_score = (weight_freq * norm_f) + (weight_tfidf * norm_t)

            hybrid_scored.append({
                "id": i + 1,
                "text": sentences[i],
                "score": round(combined_score, 4),
                "token_count": freq_scored[i]["token_count"],
                "freq_score": round(freq_scored[i]["score"], 4),
                "tfidf_score": round(tfidf_scored[i]["score"], 4)
            })
        return hybrid_scored

    @classmethod
    def summarize(
        cls,
        text: str,
        num_sentences: int = 3,
        weight_freq: float = 0.5,
        weight_tfidf: float = 0.5
    ) -> Tuple[str, List[Dict[str, Any]]]:
        """
        End-to-end hybrid summarization pipeline:
        Preprocess -> Score (Freq + TF-IDF) -> Weighted Blend -> Rank -> Top-K -> Restore Order.
        """
        preprocessed = Preprocessor.preprocess(text)
        sentences = preprocessed["original_sentences"]
        if not sentences:
            return "", []

        weights = FrequencySummarizer.calculate_word_frequencies(preprocessed["tokens"])
        scored = cls.score_sentences(
            sentences,
            weights,
            weight_freq=weight_freq,
            weight_tfidf=weight_tfidf
        )
        return RankingService.rank_and_select(scored, num_sentences=num_sentences)
