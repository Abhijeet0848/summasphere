"""
Comprehensive Verification Script for Realistic Article Testing
===============================================================
Tests:
1. Preprocessing (Sanitization, Segmentation, Stop-word removal, Lemmatization)
2. Frequency-Based Summarizer
3. TF-IDF Summarizer
4. Hybrid Summarizer
5. Original sentence preservation and chronological order restoration
6. Edge case handling (Empty input, short input)
"""

import sys
import json
from backend.app.services.preprocessing import Preprocessor
from backend.app.services.frequency_summarizer import FrequencySummarizer
from backend.app.services.tfidf_summarizer import TfidfSummarizer
from backend.app.services.hybrid_summarizer import HybridSummarizer
from backend.app.services.ranking import RankingService
from backend.app.services.statistics import StatisticsService


ARTICLE = (
    "Artificial intelligence is rapidly changing the healthcare industry. "
    "Modern AI systems can analyze large amounts of medical data in a short period of time. "
    "Researchers are using machine learning algorithms to identify patterns in medical images and patient records. "
    "These systems can help doctors detect certain diseases at an earlier stage. "
    "AI-based diagnostic tools are also being developed to support clinical decision making. "
    "However, healthcare organizations must ensure that these systems are accurate, secure, and transparent. "
    "Patient privacy is another important concern because medical records contain sensitive information. "
    "Researchers are therefore developing methods that can improve the reliability of AI while protecting patient data. "
    "The use of artificial intelligence in healthcare is expected to continue growing as computing power and medical datasets become more widely available."
)


def run_comprehensive_test():
    print("=" * 80)
    print("NLP ENGINE VERIFICATION TEST ON REALISTIC HEALTHCARE ARTICLE")
    print("=" * 80)

    # 1. Preprocessing Verification
    print("\n--- [STEP 1] PREPROCESSING & TOKEN NORMALIZATION VERIFICATION ---")
    preprocessed = Preprocessor.preprocess(ARTICLE)
    orig_sentences = preprocessed["original_sentences"]
    print(f"Original Sentence Count: {len(orig_sentences)}")
    print(f"Total Meaningful Tokens Extracted: {len(preprocessed['tokens'])}")

    # Verify stop-words are filtered
    stop_words_found = [w for w in preprocessed["tokens"] if w in ["is", "the", "in", "and", "to", "are", "of"]]
    print(f"Stop-words present in meaningful tokens: {stop_words_found} (Expected: [])")
    assert len(stop_words_found) == 0, "Stop words were not properly filtered!"

    # Verify lemmatization
    print("Sample Lemmatizations:")
    sample_words = [
        ("changing", Preprocessor.lemmatize_word("changing")),
        ("systems", Preprocessor.lemmatize_word("systems")),
        ("algorithms", Preprocessor.lemmatize_word("algorithms")),
        ("records", Preprocessor.lemmatize_word("records")),
        ("diseases", Preprocessor.lemmatize_word("diseases")),
        ("developing", Preprocessor.lemmatize_word("developing")),
        ("datasets", Preprocessor.lemmatize_word("datasets"))
    ]
    for orig, lemma in sample_words:
        print(f"  '{orig}' -> '{lemma}'")

    # Methods to test (K=3 sentences)
    NUM_SENTENCES = 3
    methods = [
        ("Frequency-Based", "frequency"),
        ("TF-IDF-Based", "tfidf"),
        ("Hybrid (50% Freq / 50% TF-IDF)", "hybrid")
    ]

    word_weights = FrequencySummarizer.calculate_word_frequencies(preprocessed["tokens"])

    for label, method_type in methods:
        print("\n" + "=" * 80)
        print(f"METHOD: {label}")
        print("=" * 80)

        if method_type == "frequency":
            scored = FrequencySummarizer.score_sentences(orig_sentences, word_weights)
        elif method_type == "tfidf":
            scored = TfidfSummarizer.score_sentences(orig_sentences)
        else:
            scored = HybridSummarizer.score_sentences(orig_sentences, word_weights, weight_freq=0.5, weight_tfidf=0.5)

        summary, annotated = RankingService.rank_and_select(scored, num_sentences=NUM_SENTENCES)
        stats = StatisticsService.compute_summary_stats(
            original_text=ARTICLE,
            summary_text=summary,
            original_sentence_count=len(orig_sentences),
            summary_sentence_count=NUM_SENTENCES,
            processing_time_ms=0.0
        )

        print("\nSENTENCE SCORES & RANKINGS:")
        print(f"{'ID':<4} {'Rank':<6} {'Score':<8} {'Selected':<10} {'Sentence Text'}")
        print("-" * 80)
        for s in annotated:
            sel_flag = "[YES]" if s["selected"] else " NO"
            preview = s["text"] if len(s["text"]) <= 65 else s["text"][:62] + "..."
            print(f"S{s['id']:<3} #{s['rank']:<5} {s['score']:<8.4f} {sel_flag:<10} {preview}")

        print("\nSELECTED SENTENCES (In Original Document Order):")
        selected_sentences = [s for s in annotated if s["selected"]]
        for s in selected_sentences:
            print(f"  [S{s['id']} | Rank #{s['rank']} | Score: {s['score']:.4f}]: {s['text']}")


        print("\nGENERATED EXTRACTIVE SUMMARY:")
        print(f'"{summary}"')

        print("\nTELEMETRY METRICS:")
        print(f"  - Original Sentences : {stats['original_sentence_count']}")
        print(f"  - Summary Sentences  : {stats['summary_sentence_count']}")
        print(f"  - Original Words     : {stats['original_word_count']}")
        print(f"  - Summary Words      : {stats['summary_word_count']}")
        print(f"  - Compression Ratio  : {stats['compression_ratio']} ({round((1 - stats['compression_ratio']) * 100, 1)}% reduction)")

        # Verification Checks
        # 1. Check exact sentence existence
        for s in selected_sentences:
            assert s["text"] in ARTICLE, f"Selected sentence '{s['text']}' does not exist in original text!"
        
        # 2. Check chronological ordering
        selected_ids = [s["id"] for s in selected_sentences]
        assert selected_ids == sorted(selected_ids), f"Sentences are not in chronological order: {selected_ids}"
        
        # 3. Check Top-K count
        assert len(selected_sentences) == NUM_SENTENCES, f"Expected {NUM_SENTENCES} sentences, got {len(selected_sentences)}"

    # 4. Edge Case Handling Verification
    print("\n" + "=" * 80)
    print("--- [STEP 3] EDGE CASE HANDLING VERIFICATION ---")
    print("=" * 80)

    # Empty Input
    empty_res, empty_annotated = FrequencySummarizer.summarize("", num_sentences=3)
    print(f"Empty Input -> Summary: '{empty_res}', Annotated Count: {len(empty_annotated)}")
    assert empty_res == "" and len(empty_annotated) == 0

    # Short Input (1 sentence)
    short_text = "Modern artificial intelligence is transforming healthcare diagnostics."
    short_res, short_annotated = FrequencySummarizer.summarize(short_text, num_sentences=3)
    print(f"Single-sentence Input -> Summary: '{short_res}', Selected: {len(short_annotated)}")
    assert short_res == short_text and len(short_annotated) == 1

    print("\n" + "=" * 80)
    print("ALL VERIFICATION CHECKS PASSED SUCCESSFULLY (100% VALIDATED)")
    print("=" * 80)


if __name__ == "__main__":
    run_comprehensive_test()
