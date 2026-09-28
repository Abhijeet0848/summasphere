"""
ROUGE Evaluation Service
========================
Calculates Recall-Oriented Understudy for Gisting Evaluation (ROUGE):
- ROUGE-1 (Unigram Overlap)
- ROUGE-2 (Bigram Overlap)
- ROUGE-L (Longest Common Subsequence)
"""

import re
from collections import Counter
from typing import Dict, List, Any
from backend.app.services.preprocessing import Preprocessor


class RougeEvaluator:
    """Calculates explicit ROUGE metrics between generated and reference summaries."""

    @staticmethod
    def _get_unigrams(text: str) -> List[str]:
        return Preprocessor.tokenize(text.lower())

    @staticmethod
    def _get_bigrams(tokens: List[str]) -> List[str]:
        if len(tokens) < 2:
            return []
        return [f"{tokens[i]} {tokens[i+1]}" for i in range(len(tokens) - 1)]

    @staticmethod
    def _lcs_length(seq_a: List[str], seq_b: List[str]) -> int:
        m, n = len(seq_a), len(seq_b)
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if seq_a[i - 1] == seq_b[j - 1]:
                    dp[i][j] = dp[i - 1][j - 1] + 1
                else:
                    dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
        return dp[m][n]

    @classmethod
    def _compute_prf(cls, cand_tokens: List[str], ref_tokens: List[str]) -> Dict[str, float]:
        if not cand_tokens or not ref_tokens:
            return {"precision": 0.0, "recall": 0.0, "f1": 0.0}

        cand_counts = Counter(cand_tokens)
        ref_counts = Counter(ref_tokens)

        # Overlap = sum of minimum frequency counts
        overlap = sum((cand_counts & ref_counts).values())

        precision = overlap / len(cand_tokens) if cand_tokens else 0.0
        recall = overlap / len(ref_tokens) if ref_tokens else 0.0
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

        return {
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1": round(f1, 4)
        }

    @classmethod
    def evaluate(cls, candidate: str, reference: str) -> Dict[str, Dict[str, float]]:
        """Computes ROUGE-1, ROUGE-2, and ROUGE-L."""
        cand_uni = cls._get_unigrams(candidate)
        ref_uni = cls._get_unigrams(reference)

        # 1. ROUGE-1
        rouge_1 = cls._compute_prf(cand_uni, ref_uni)

        # 2. ROUGE-2
        cand_bi = cls._get_bigrams(cand_uni)
        ref_bi = cls._get_bigrams(ref_uni)
        rouge_2 = cls._compute_prf(cand_bi, ref_bi)

        # 3. ROUGE-L
        lcs_len = cls._lcs_length(cand_uni, ref_uni)
        rl_p = lcs_len / len(cand_uni) if cand_uni else 0.0
        rl_r = lcs_len / len(ref_uni) if ref_uni else 0.0
        rl_f1 = (2 * rl_p * rl_r) / (rl_p + rl_r) if (rl_p + rl_r) > 0 else 0.0
        rouge_l = {
            "precision": round(rl_p, 4),
            "recall": round(rl_r, 4),
            "f1": round(rl_f1, 4)
        }

        return {
            "rouge_1": rouge_1,
            "rouge_2": rouge_2,
            "rouge_l": rouge_l
        }
