"""
TF-IDF Extractive Summarization Module
======================================
Calculates sentence-level importance based on Term Frequency - Inverse Document Frequency (TF-IDF):
1. Treats each segmented sentence as a separate mini-document in the document collection.
2. Fits scikit-learn TfidfVectorizer (or native mathematical TF-IDF fallback).
3. Computes sentence score by aggregating TF-IDF values of meaningful words in that sentence.
4. Normalizes sentence scores and supports Top-K selection with chronological order preservation.
"""

import math
from collections import Counter
from typing import List, Dict, Any, Tuple
from backend.app.services.preprocessing import Preprocessor
from backend.app.services.ranking import RankingService

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    _HAS_SKLEARN = True
except ImportError:
    _HAS_SKLEARN = False


class TfidfSummarizer:
    """Computes sentence importance scores using TF-IDF term statistics."""

    @classmethod
    def score_sentences(cls, sentences: List[str]) -> List[Dict[str, Any]]:
        """
        Calculates TF-IDF scores for each sentence in the document.
        - Uses scikit-learn TfidfVectorizer on normalized token sequences.
        - Averages non-zero TF-IDF values normalized by sentence length.
        """
        if not sentences:
            return []

        # Prepare normalized token representations per sentence
        doc_tokens = [Preprocessor.tokenize_and_normalize(s) for s in sentences]
        tokenized_sentences = [" ".join(tokens) for tokens in doc_tokens]

        # 1. Use scikit-learn when available and vocabulary exists
        if _HAS_SKLEARN and any(s.strip() for s in tokenized_sentences):
            try:
                vectorizer = TfidfVectorizer(token_pattern=r"(?u)\b\w+\b")
                tfidf_matrix = vectorizer.fit_transform(tokenized_sentences)

                scored = []
                for idx, sentence in enumerate(sentences):
                    tokens = doc_tokens[idx]
                    if not tokens:
                        scored.append({
                            "id": idx + 1,
                            "text": sentence,
                            "score": 0.0,
                            "token_count": 0
                        })
                        continue

                    # Extract TF-IDF vector for this sentence
                    row_data = tfidf_matrix[idx].toarray()[0]
                    nonzero_scores = [val for val in row_data if val > 0]
                    sentence_score = sum(nonzero_scores) / (len(nonzero_scores) ** 0.5) if nonzero_scores else 0.0

                    scored.append({
                        "id": idx + 1,
                        "text": sentence,
                        "score": round(float(sentence_score), 4),
                        "token_count": len(tokens)
                    })
                return scored
            except Exception:
                pass

        # 2. Native mathematical fallback for TF-IDF calculation
        total_docs = len(sentences)
        df = Counter()
        for tokens in doc_tokens:
            for unique_w in set(tokens):
                df[unique_w] += 1

        # Smooth IDF: ln((N + 1) / (DF + 1)) + 1
        idf = {word: math.log((total_docs + 1) / (count + 1)) + 1.0 for word, count in df.items()}

        scored = []
        for idx, sentence in enumerate(sentences):
            tokens = doc_tokens[idx]
            if not tokens:
                scored.append({
                    "id": idx + 1,
                    "text": sentence,
                    "score": 0.0,
                    "token_count": 0
                })
                continue
            tf = Counter(tokens)
            doc_len = len(tokens)
            raw_tfidf = sum((tf[w] / doc_len) * idf.get(w, 0.0) for w in tokens)
            score = raw_tfidf / (doc_len ** 0.2 if doc_len > 0 else 1.0)

            scored.append({
                "id": idx + 1,
                "text": sentence,
                "score": round(score, 4),
                "token_count": doc_len
            })
        return scored

    @classmethod
    def summarize(
        cls,
        text: str,
        num_sentences: int = 3
    ) -> Tuple[str, List[Dict[str, Any]]]:
        """
        End-to-end TF-IDF summarization pipeline:
        Preprocess -> Segment -> Compute TF-IDF -> Score -> Rank -> Top-K -> Restore Order.
        """
        cleaned = Preprocessor.clean_text(text)
        sentences = Preprocessor.segment_sentences(cleaned)
        if not sentences:
            return "", []

        scored = cls.score_sentences(sentences)
        return RankingService.rank_and_select(scored, num_sentences=num_sentences)
