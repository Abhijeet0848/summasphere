"""
Advanced Extractive Text Summarizer Engine
==========================================
A comprehensive NLP summarization suite featuring multiple algorithms:
1. Normalized Word Frequency (Base Architecture)
2. TF-IDF Sentence Scoring
3. TextRank Graph Algorithm (PageRank over Sentence Similarity Graph)
4. Position & Title Weighting
5. Built-in ROUGE Metric Evaluator (ROUGE-1, ROUGE-2, ROUGE-L)
"""

import re
import sys
import math
import json
import argparse
from collections import Counter
from typing import List, Tuple, Dict, Any, Optional, Set

# Standard English stop words
DEFAULT_STOP_WORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
    "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't",
    "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during",
    "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have",
    "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers",
    "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm",
    "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's",
    "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off",
    "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out",
    "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should",
    "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their",
    "theirs", "them", "themselves", "then", "there", "there's", "these", "they",
    "they'd", "they'll", "they're", "they've", "this", "those", "through", "to",
    "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll",
    "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where",
    "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with",
    "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've",
    "your", "yours", "yourself", "yourselves"
}

# Fallback morphological lemmatizer enabled for zero-dependency high-speed execution
_LEMMATIZER = None



class ExtractiveSummarizer:
    """
    Multi-algorithmic extractive text summarization suite.
    """

    def __init__(self, stop_words: Optional[Set[str]] = None):
        self.stop_words = stop_words if stop_words is not None else DEFAULT_STOP_WORDS

    # -------------------------------------------------------------------------
    # Preprocessing
    # -------------------------------------------------------------------------
    def clean_text(self, raw_text: str) -> str:
        if not raw_text or not isinstance(raw_text, str):
            return ""
        import html
        text = html.unescape(raw_text)
        text = re.sub(r"<[^>]+>", "", text)
        text = text.replace("&nbsp;", " ").replace("\xa0", " ").replace("\u200b", "")
        text = re.sub(r"[\r\n\t]+", " ", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text

    def segment_sentences(self, cleaned_text: str) -> List[str]:
        if not cleaned_text:
            return []
        sentence_pattern = r'(?<=[.!?])\s+(?=[A-Z0-9"\'\(\[])'
        sentences = re.split(sentence_pattern, cleaned_text)
        if len(sentences) == 1 and not any(sentences[0].endswith(p) for p in [".", "!", "?"]):
            parts = [s.strip() for s in re.split(r'[\n;]+', cleaned_text) if s.strip()]
            if len(parts) > 1:
                return parts
        return [s.strip() for s in sentences if s.strip()]

    def _lemmatize_word(self, word: str) -> str:
        if _LEMMATIZER:
            try:
                return _LEMMATIZER.lemmatize(word.lower())
            except Exception:
                pass
        w = word.lower()
        if w.endswith("ies") and len(w) > 4:
            return w[:-3] + "y"
        if w.endswith("ing") and len(w) > 5:
            return w[:-3]
        if w.endswith("ed") and len(w) > 4:
            return w[:-2]
        if w.endswith("es") and len(w) > 4:
            return w[:-2]
        if w.endswith("s") and len(w) > 3 and not w.endswith("ss"):
            return w[:-1]
        return w

    def tokenize_and_normalize(self, text: str) -> List[str]:
        if not text:
            return []
        raw_words = re.findall(r"\b[A-Za-z0-9'-]+\b", text.lower())
        normalized = []
        for word in raw_words:
            clean_w = word.strip("'-")
            if clean_w and clean_w not in self.stop_words and not clean_w.isdigit() and len(clean_w) > 1:
                lemma = self._lemmatize_word(clean_w)
                normalized.append(lemma)
        return normalized

    # -------------------------------------------------------------------------
    # Algorithm 1: Word Frequency Scoring (Base)
    # -------------------------------------------------------------------------
    def calculate_word_frequencies(self, words: List[str]) -> Dict[str, float]:
        if not words:
            return {}
        counts = Counter(words)
        max_freq = max(counts.values())
        return {word: count / max_freq for word, count in counts.items()}

    def score_by_frequency(self, sentences: List[str], word_weights: Dict[str, float]) -> List[Dict[str, Any]]:
        scored = []
        for idx, sentence in enumerate(sentences):
            words = self.tokenize_and_normalize(sentence)
            score = sum(word_weights.get(w, 0.0) for w in words)
            scored.append({
                "index": idx,
                "sentence": sentence,
                "score": score,
                "token_count": len(words)
            })
        return scored

    # -------------------------------------------------------------------------
    # Algorithm 2: TF-IDF Scoring
    # -------------------------------------------------------------------------
    def score_by_tfidf(self, sentences: List[str]) -> List[Dict[str, Any]]:
        """
        Computes TF-IDF scores treating each sentence as an individual document.
        """
        if not sentences:
            return []

        doc_tokens = [self.tokenize_and_normalize(s) for s in sentences]
        total_docs = len(sentences)

        # Document Frequency (DF)
        df = Counter()
        for tokens in doc_tokens:
            for unique_token in set(tokens):
                df[unique_token] += 1

        # Inverse Document Frequency (IDF) with smoothing
        idf = {word: math.log((total_docs + 1) / (count + 1)) + 1.0 for word, count in df.items()}

        scored = []
        for idx, (sentence, tokens) in enumerate(zip(sentences, doc_tokens)):
            if not tokens:
                scored.append({"index": idx, "sentence": sentence, "score": 0.0, "token_count": 0})
                continue
            tf = Counter(tokens)
            doc_len = len(tokens)
            # Sum of (TF * IDF) normalized by sentence length
            sentence_tfidf = sum((tf[w] / doc_len) * idf.get(w, 0.0) for w in tokens)
            scored.append({
                "index": idx,
                "sentence": sentence,
                "score": sentence_tfidf,
                "token_count": doc_len
            })
        return scored

    # -------------------------------------------------------------------------
    # Algorithm 3: TextRank (Graph-based PageRank)
    # -------------------------------------------------------------------------
    def score_by_textrank(
        self,
        sentences: List[str],
        damping: float = 0.85,
        max_iter: int = 50,
        convergence: float = 1e-4
    ) -> List[Dict[str, Any]]:
        """
        Builds a sentence similarity graph and executes PageRank iterations.
        Similarity(S_i, S_j) = |tokens(S_i) ∩ tokens(S_j)| / (log(|tokens(S_i)|) + log(|tokens(S_j)|))
        """
        n = len(sentences)
        if n == 0:
            return []
        if n == 1:
            return [{"index": 0, "sentence": sentences[0], "score": 1.0, "token_count": len(self.tokenize_and_normalize(sentences[0]))}]

        tokens_list = [set(self.tokenize_and_normalize(s)) for s in sentences]

        # Construct Similarity Matrix
        sim_matrix = [[0.0] * n for _ in range(n)]
        for i in range(n):
            for j in range(i + 1, n):
                t_i, t_j = tokens_list[i], tokens_list[j]
                if len(t_i) > 0 and len(t_j) > 0:
                    common = len(t_i.intersection(t_j))
                    if common > 0:
                        denominator = math.log(len(t_i) + 1) + math.log(len(t_j) + 1)
                        weight = common / denominator if denominator > 0 else 0.0
                        sim_matrix[i][j] = weight
                        sim_matrix[j][i] = weight

        # PageRank Algorithm
        scores = [1.0 / n] * n
        for _ in range(max_iter):
            prev_scores = list(scores)
            max_diff = 0.0
            for i in range(n):
                rank_sum = 0.0
                for j in range(n):
                    if i != j and sim_matrix[j][i] > 0:
                        sum_out = sum(sim_matrix[j])
                        if sum_out > 0:
                            rank_sum += (sim_matrix[j][i] / sum_out) * prev_scores[j]
                scores[i] = (1.0 - damping) + damping * rank_sum
                max_diff = max(max_diff, abs(scores[i] - prev_scores[i]))
            if max_diff < convergence:
                break

        return [
            {"index": idx, "sentence": s, "score": scores[idx], "token_count": len(tokens_list[idx])}
            for idx, s in enumerate(sentences)
        ]

    # -------------------------------------------------------------------------
    # Optional Position Bias (Intro & Conclusion Weighting)
    # -------------------------------------------------------------------------
    def apply_position_weights(self, scored_sentences: List[Dict[str, Any]], weight: float = 0.15) -> List[Dict[str, Any]]:
        n = len(scored_sentences)
        if n <= 2:
            return scored_sentences
        for item in scored_sentences:
            idx = item["index"]
            # First sentence (introductory) and last sentence (conclusion) boost
            if idx == 0:
                item["score"] *= (1.0 + weight * 1.5)
            elif idx == 1 or idx == n - 1:
                item["score"] *= (1.0 + weight)
        return scored_sentences

    # -------------------------------------------------------------------------
    # Extraction
    # -------------------------------------------------------------------------
    def extract_summary(
        self,
        scored_sentences: List[Dict[str, Any]],
        top_n: Optional[int] = None,
        ratio: Optional[float] = None
    ) -> Tuple[str, List[Dict[str, Any]]]:
        if not scored_sentences:
            return "", []

        total_sentences = len(scored_sentences)
        if ratio is not None and 0.0 < ratio <= 1.0:
            target_count = max(1, int(round(total_sentences * ratio)))
        elif top_n is not None and top_n > 0:
            target_count = min(top_n, total_sentences)
        else:
            target_count = min(3, total_sentences)

        ranked = sorted(scored_sentences, key=lambda x: x["score"], reverse=True)
        selected = ranked[:target_count]
        in_order = sorted(selected, key=lambda x: x["index"])

        summary = " ".join(item["sentence"] for item in in_order)
        return summary, in_order

    # -------------------------------------------------------------------------
    # Main Multi-Algorithm Summarize Method
    # -------------------------------------------------------------------------
    def summarize(
        self,
        raw_text: str,
        algorithm: str = "frequency",
        top_n: Optional[int] = 3,
        ratio: Optional[float] = None,
        use_position_weight: bool = False
    ) -> Dict[str, Any]:
        cleaned_text = self.clean_text(raw_text)
        sentences = self.segment_sentences(cleaned_text)

        if not sentences:
            return {
                "summary": "",
                "algorithm": algorithm,
                "extracted_sentences": [],
                "sentence_scores": [],
                "word_frequencies": {},
                "metrics": {
                    "original_characters": len(raw_text or ""),
                    "cleaned_characters": 0,
                    "original_sentences": 0,
                    "summary_sentences": 0,
                    "compression_ratio": 0.0
                }
            }

        normalized_words = self.tokenize_and_normalize(cleaned_text)
        word_weights = self.calculate_word_frequencies(normalized_words)

        # Select Algorithm
        algo_lower = algorithm.lower().strip()
        if algo_lower == "tfidf":
            scored = self.score_by_tfidf(sentences)
        elif algo_lower == "textrank":
            scored = self.score_by_textrank(sentences)
        else:
            # Default: Word frequency
            scored = self.score_by_frequency(sentences, word_weights)
            algo_lower = "frequency"

        if use_position_weight:
            scored = self.apply_position_weights(scored)

        summary, extracted = self.extract_summary(scored, top_n=top_n, ratio=ratio)

        comp_ratio = round(
            (len(summary) / max(len(cleaned_text), 1)) * 100, 2
        ) if cleaned_text else 0.0

        return {
            "summary": summary,
            "algorithm": algo_lower,
            "extracted_sentences": extracted,
            "sentence_scores": scored,
            "word_frequencies": dict(sorted(word_weights.items(), key=lambda x: x[1], reverse=True)),
            "metrics": {
                "original_characters": len(raw_text or ""),
                "cleaned_characters": len(cleaned_text),
                "original_sentences": len(sentences),
                "summary_sentences": len(extracted),
                "compression_ratio": comp_ratio,
                "vocabulary_size": len(word_weights)
            }
        }

    # -------------------------------------------------------------------------
    # Evaluation: Built-in ROUGE Metric Calculator
    # -------------------------------------------------------------------------
    @staticmethod
    def calculate_rouge(candidate_summary: str, reference_summary: str) -> Dict[str, Dict[str, float]]:
        """
        Calculates ROUGE-1 (unigram), ROUGE-2 (bigram), and ROUGE-L (LCS).
        """
        def get_unigrams(text):
            return re.findall(r"\b\w+\b", text.lower())

        def get_bigrams(tokens):
            return [f"{tokens[i]} {tokens[i+1]}" for i in range(len(tokens) - 1)]

        def lcs_length(x, y):
            m, n = len(x), len(y)
            dp = [[0] * (n + 1) for _ in range(m + 1)]
            for i in range(1, m + 1):
                for j in range(1, n + 1):
                    if x[i - 1] == y[j - 1]:
                        dp[i][j] = dp[i - 1][j - 1] + 1
                    else:
                        dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
            return dp[m][n]

        def compute_prf(cand_tokens, ref_tokens):
            if not cand_tokens or not ref_tokens:
                return {"precision": 0.0, "recall": 0.0, "f1": 0.0}
            cand_c = Counter(cand_tokens)
            ref_c = Counter(ref_tokens)
            overlap = sum((cand_c & ref_c).values())
            p = overlap / len(cand_tokens) if cand_tokens else 0.0
            r = overlap / len(ref_tokens) if ref_tokens else 0.0
            f1 = (2 * p * r) / (p + r) if (p + r) > 0 else 0.0
            return {"precision": round(p, 4), "recall": round(r, 4), "f1": round(f1, 4)}

        cand_uni = get_unigrams(candidate_summary)
        ref_uni = get_unigrams(reference_summary)

        # ROUGE-1
        r1 = compute_prf(cand_uni, ref_uni)

        # ROUGE-2
        cand_bi = get_bigrams(cand_uni)
        ref_bi = get_bigrams(ref_uni)
        r2 = compute_prf(cand_bi, ref_bi)

        # ROUGE-L
        lcs_len = lcs_length(cand_uni, ref_uni)
        rl_p = lcs_len / len(cand_uni) if cand_uni else 0.0
        rl_r = lcs_len / len(ref_uni) if ref_uni else 0.0
        rl_f1 = (2 * rl_p * rl_r) / (rl_p + rl_r) if (rl_p + rl_r) > 0 else 0.0
        rl = {"precision": round(rl_p, 4), "recall": round(rl_r, 4), "f1": round(rl_f1, 4)}

        return {"rouge-1": r1, "rouge-2": r2, "rouge-l": rl}


def main():
    parser = argparse.ArgumentParser(description="Multi-Algorithmic Extractive Text Summarizer")
    parser.add_argument("-f", "--file", type=str, help="Input file path")
    parser.add_argument("-t", "--text", type=str, help="Raw text string")
    parser.add_argument("-a", "--algo", type=str, default="frequency", choices=["frequency", "tfidf", "textrank"], help="Algorithm: frequency | tfidf | textrank")
    parser.add_argument("-n", "--top-n", type=int, default=3, help="Sentence count")
    parser.add_argument("-r", "--ratio", type=float, default=None, help="Compression ratio (0.1 - 1.0)")
    parser.add_argument("-p", "--position", action="store_true", help="Apply position weighting")
    parser.add_argument("--json", action="store_true", help="Output full JSON telemetry")
    args = parser.parse_args()

    input_text = ""
    if args.file:
        with open(args.file, "r", encoding="utf-8") as f:
            input_text = f.read()
    elif args.text:
        input_text = args.text
    else:
        if not sys.stdin.isatty():
            input_text = sys.stdin.read()
        else:
            parser.print_help()
            sys.exit(0)

    if not input_text.strip():
        print("Error: No input text provided.", file=sys.stderr)
        sys.exit(1)


    summarizer = ExtractiveSummarizer()
    res = summarizer.summarize(
        input_text,
        algorithm=args.algo,
        top_n=args.top_n,
        ratio=args.ratio,
        use_position_weight=args.position
    )

    if args.json:
        print(json.dumps(res, indent=2))
    else:
        print(f"[{args.algo.upper()} SUMMARY]")
        print(res["summary"])


if __name__ == "__main__":
    main()
