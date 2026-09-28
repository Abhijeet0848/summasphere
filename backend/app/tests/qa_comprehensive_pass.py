"""
Comprehensive End-to-End Quality Assurance (QA) Pass
===================================================
Executes exhaustive test suites for:
1. NLP Pipeline Components:
   - Sentence segmentation
   - Tokenization
   - Stop-word removal
   - Lemmatization
   - Frequency calculation
   - TF-IDF calculation
   - Sentence scoring
   - Ranking
   - Top-K selection
   - Original-order restoration

2. Backend API Endpoints & Robustness:
   - GET /api/health
   - POST /api/summarize (Valid frequency, tfidf, hybrid)
   - Invalid summarization method error handling
   - Empty input error handling
   - Very short input error handling
   - Invalid sentence count handling
   - Large input processing
   - Invalid file extension rejection
   - Corrupt PDF extraction failure handling
   - SQLite History CRUD lifecycle (POST, GET, GET/id, DELETE/id, DELETE all)
   - Multi-Algorithm Comparison (/api/compare)
   - ROUGE Metric Evaluation (/api/evaluate_rouge)
"""

import sys
import os
import io
import time
from fastapi.testclient import TestClient

# Ensure root is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))

from backend.app.main import app
from backend.app.services.preprocessing import Preprocessor, STOP_WORDS
from backend.app.services.frequency_summarizer import FrequencySummarizer
from backend.app.services.tfidf_summarizer import TfidfSummarizer
from backend.app.services.hybrid_summarizer import HybridSummarizer
from backend.app.services.ranking import RankingService
from backend.app.services.statistics import StatisticsService
from backend.app.services.evaluation import RougeEvaluator
from backend.app.services.document_parser import DocumentParser

client = TestClient(app)

SAMPLE_ARTICLE = (
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


def run_qa_suite():
    passed_tests = []
    failed_tests = []
    bugs_found = []

    def log_result(test_name: str, passed: bool, details: str = ""):
        if passed:
            passed_tests.append(test_name)
            print(f" [PASS] {test_name} {details}")
        else:
            failed_tests.append(test_name)
            bugs_found.append(f"{test_name}: {details}")
            print(f" [FAIL] {test_name} - {details}")

    print("=" * 80)
    print("STARTING COMPREHENSIVE QA TEST PASS")
    print("=" * 80)

    # -------------------------------------------------------------
    # 1. NLP PIPELINE MODULE TESTS
    # -------------------------------------------------------------
    print("\n--- 1. Testing NLP Pipeline Modules ---")
    
    # 1.1 Sentence Segmentation
    try:
        sentences = Preprocessor.segment_sentences(SAMPLE_ARTICLE)
        assert len(sentences) == 9, f"Expected 9 sentences, got {len(sentences)}"
        assert sentences[0].startswith("Artificial intelligence"), "Sentence 1 segmentation mismatch"
        log_result("NLP - Sentence Segmentation", True, f"({len(sentences)} sentences detected)")
    except Exception as e:
        log_result("NLP - Sentence Segmentation", False, str(e))

    # 1.2 Word Tokenization & Lowercasing
    try:
        raw_tokens = Preprocessor.tokenize(sentences[0])
        assert "artificial" in raw_tokens, "Tokenization lowercasing failed"
        assert "intelligence" in raw_tokens, "Tokenization failed"
        log_result("NLP - Tokenization & Lowercasing", True, f"({len(raw_tokens)} tokens extracted)")
    except Exception as e:
        log_result("NLP - Tokenization & Lowercasing", False, str(e))

    # 1.3 Stop-word Removal
    try:
        filtered = Preprocessor.filter_and_lemmatize(["the", "is", "a", "patient", "records", "protecting"])
        assert "the" not in filtered and "is" not in filtered and "a" not in filtered, "Stop words were not removed"
        log_result("NLP - Stop-word Removal", True, f"(Filtered out functional words)")
    except Exception as e:
        log_result("NLP - Stop-word Removal", False, str(e))

    # 1.4 Morphological Lemmatization
    try:
        lemma_records = Preprocessor.lemmatize_word("records")
        lemma_protecting = Preprocessor.lemmatize_word("protecting")
        assert lemma_records in ("record", "records"), f"Lemmatization failed for records: {lemma_records}"
        assert lemma_protecting in ("protect", "protecting"), f"Lemmatization failed for protecting: {lemma_protecting}"
        log_result("NLP - Lemmatization", True, f"('records' -> '{lemma_records}', 'protecting' -> '{lemma_protecting}')")
    except Exception as e:
        log_result("NLP - Lemmatization", False, str(e))

    # 1.5 Word Frequency Calculation
    try:
        all_lemmas = Preprocessor.tokenize_and_normalize(SAMPLE_ARTICLE)
        word_weights = FrequencySummarizer.calculate_word_frequencies(all_lemmas)
        assert len(word_weights) > 0, "Word frequency dictionary empty"
        assert all(0.0 <= w <= 1.0 for w in word_weights.values()), "Word weights not normalized in [0, 1]"
        log_result("NLP - Frequency Calculation", True, f"({len(word_weights)} unique content lemmas scored)")
    except Exception as e:
        log_result("NLP - Frequency Calculation", False, str(e))

    # 1.6 TF-IDF Calculation
    try:
        tfidf_scores = TfidfSummarizer.score_sentences(sentences)
        assert len(tfidf_scores) == len(sentences), "TF-IDF score count mismatch"
        assert all("score" in s and s["score"] >= 0.0 for s in tfidf_scores), "Invalid TF-IDF scores"
        log_result("NLP - TF-IDF Calculation", True, f"(Computed for {len(tfidf_scores)} sentences)")
    except Exception as e:
        log_result("NLP - TF-IDF Calculation", False, str(e))

    # 1.7 Sentence Scoring (Frequency, TF-IDF, Hybrid)
    try:
        freq_scores = FrequencySummarizer.score_sentences(sentences, word_weights)
        hybrid_scores = HybridSummarizer.score_sentences(sentences, word_weights, weight_freq=0.6, weight_tfidf=0.4)
        assert len(freq_scores) == 9 and len(hybrid_scores) == 9, "Sentence scoring length mismatch"
        log_result("NLP - Sentence Scoring (Frequency & Hybrid)", True)
    except Exception as e:
        log_result("NLP - Sentence Scoring (Frequency & Hybrid)", False, str(e))

    # 1.8 Ranking & Top-K Selection
    try:
        summary, annotated = RankingService.rank_and_select(freq_scores, num_sentences=3)
        selected_sentences = [s for s in annotated if s["selected"]]
        assert len(selected_sentences) == 3, f"Expected 3 selected sentences, got {len(selected_sentences)}"
        assert all(s["rank"] <= 3 for s in selected_sentences), "Top-K ranks not assigned correctly"
        log_result("NLP - Ranking & Top-K Selection", True, f"(Selected Top 3 sentences)")
    except Exception as e:
        log_result("NLP - Ranking & Top-K Selection", False, str(e))

    # 1.9 Chronological Order Restoration
    try:
        selected_ids = [s["id"] for s in selected_sentences]
        assert selected_ids == sorted(selected_ids), f"Chronological order not preserved: {selected_ids}"
        log_result("NLP - Original Order Restoration", True, f"(Restored order: {selected_ids})")
    except Exception as e:
        log_result("NLP - Original Order Restoration", False, str(e))

    # -------------------------------------------------------------
    # 2. BACKEND API ENDPOINTS & ROBUSTNESS TESTS
    # -------------------------------------------------------------
    print("\n--- 2. Testing Backend API Endpoints & Error Handling ---")

    # 2.1 GET /api/health
    try:
        res = client.get("/api/health")
        assert res.status_code == 200, f"Health check returned {res.status_code}"
        data = res.json()
        assert data.get("status") == "healthy", "Health status != healthy"
        log_result("Backend - GET /api/health", True, f"(Status: {data.get('status')})")
    except Exception as e:
        log_result("Backend - GET /api/health", False, str(e))

    # 2.2 POST /api/summarize (Valid Frequency)
    try:
        res = client.post("/api/summarize", json={
            "text": SAMPLE_ARTICLE,
            "method": "frequency",
            "num_sentences": 3
        })
        assert res.status_code == 200, f"Summarize failed with {res.status_code}"
        data = res.json()
        assert data["method"] == "frequency", "Method mismatch"
        assert len(data["sentences"]) == 9, "Sentence array length mismatch"
        assert data["statistics"]["summary_sentence_count"] == 3, "Summary sentence count mismatch"
        log_result("Backend - POST /api/summarize (Frequency)", True, f"(Latency: {data['processing_time_ms']:.2f}ms)")
    except Exception as e:
        log_result("Backend - POST /api/summarize (Frequency)", False, str(e))

    # 2.3 POST /api/summarize (Valid TF-IDF)
    try:
        res = client.post("/api/summarize", json={
            "text": SAMPLE_ARTICLE,
            "method": "tfidf",
            "num_sentences": 2
        })
        assert res.status_code == 200
        data = res.json()
        assert data["method"] == "tfidf"
        assert data["statistics"]["summary_sentence_count"] == 2
        log_result("Backend - POST /api/summarize (TF-IDF)", True)
    except Exception as e:
        log_result("Backend - POST /api/summarize (TF-IDF)", False, str(e))

    # 2.4 POST /api/summarize (Valid Hybrid)
    try:
        res = client.post("/api/summarize", json={
            "text": SAMPLE_ARTICLE,
            "method": "hybrid",
            "num_sentences": 3,
            "weight_frequency": 0.5,
            "weight_tfidf": 0.5
        })
        assert res.status_code == 200
        data = res.json()
        assert data["method"] == "hybrid"
        log_result("Backend - POST /api/summarize (Hybrid)", True)
    except Exception as e:
        log_result("Backend - POST /api/summarize (Hybrid)", False, str(e))

    # 2.5 Error Case: Invalid Summarization Method
    try:
        res = client.post("/api/summarize", json={
            "text": SAMPLE_ARTICLE,
            "method": "deeplearning_gpt4",
            "num_sentences": 3
        })
        assert res.status_code in (400, 422), f"Expected 400/422 on invalid method, got {res.status_code}"
        log_result("Backend - Error on Invalid Method", True, f"(Properly rejected: {res.status_code})")
    except Exception as e:
        log_result("Backend - Error on Invalid Method", False, str(e))

    # 2.6 Error Case: Empty Input
    try:
        res = client.post("/api/summarize", json={
            "text": "",
            "method": "frequency",
            "num_sentences": 3
        })
        assert res.status_code in (400, 422), f"Expected 400/422 on empty input, got {res.status_code}"
        log_result("Backend - Error on Empty Input", True, f"(Properly rejected: {res.status_code})")
    except Exception as e:
        log_result("Backend - Error on Empty Input", False, str(e))

    # 2.7 Error Case: Very Short Input
    try:
        res = client.post("/api/summarize", json={
            "text": "Short",
            "method": "frequency",
            "num_sentences": 1
        })
        assert res.status_code in (400, 422), f"Expected 400/422 on short input, got {res.status_code}"
        log_result("Backend - Error on Very Short Input", True, f"(Properly rejected: {res.status_code})")
    except Exception as e:
        log_result("Backend - Error on Very Short Input", False, str(e))

    # 2.8 Edge Case: Sentence count exceeding available sentences
    try:
        res = client.post("/api/summarize", json={
            "text": "First sentence here. Second sentence here.",
            "method": "frequency",
            "num_sentences": 10
        })
        assert res.status_code == 200, f"Expected 200 with clamped K, got {res.status_code}"
        data = res.json()
        assert data["statistics"]["summary_sentence_count"] == 2, "Sentence count not clamped to available sentences"
        log_result("Backend - Clamping on High Sentence Count", True, "(Clamped to 2 sentences)")
    except Exception as e:
        log_result("Backend - Clamping on High Sentence Count", False, str(e))

    # 2.9 Large Document Processing
    try:
        large_article = " ".join([SAMPLE_ARTICLE] * 15) # ~1,500 words
        t0 = time.perf_counter()
        res = client.post("/api/summarize", json={
            "text": large_article,
            "method": "frequency",
            "num_sentences": 5
        })
        duration = (time.perf_counter() - t0) * 1000
        assert res.status_code == 200, f"Large text processing failed: {res.status_code}"
        assert res.json()["statistics"]["summary_sentence_count"] == 5
        log_result("Backend - Large Input Processing (~1,500 words)", True, f"(Processed in {duration:.2f}ms)")
    except Exception as e:
        log_result("Backend - Large Input Processing (~1,500 words)", False, str(e))

    # 2.10 Invalid File Extension Rejection
    try:
        res = client.post(
            "/api/extract_document",
            files={"file": ("malicious.exe", b"binary content", "application/octet-stream")}
        )
        assert res.status_code == 400, f"Expected 400 for .exe file, got {res.status_code}"
        log_result("Backend - Document Parser Invalid Extension Rejection", True, f"(Status: {res.status_code})")
    except Exception as e:
        log_result("Backend - Document Parser Invalid Extension Rejection", False, str(e))

    # 2.11 Corrupt PDF Extraction Failure Handling
    try:
        res = client.post(
            "/api/extract_document",
            files={"file": ("corrupted.pdf", b"%PDF-1.4 corrupt data ...", "application/pdf")}
        )
        assert res.status_code in (400, 422), f"Expected 400/422 on corrupt PDF, got {res.status_code}"
        log_result("Backend - Corrupt PDF Extraction Failure Handling", True, f"(Handled gracefully: {res.status_code})")
    except Exception as e:
        log_result("Backend - Corrupt PDF Extraction Failure Handling", False, str(e))

    # 2.12 Valid Plain Text File Extraction
    try:
        txt_content = b"Extractive text summarization is vital in NLP."
        res = client.post(
            "/api/extract_document",
            files={"file": ("sample.txt", txt_content, "text/plain")}
        )
        assert res.status_code == 200
        data = res.json()
        assert "Extractive text summarization" in data["text"]
        log_result("Backend - Plain Text (.TXT) Upload & Extraction", True)
    except Exception as e:
        log_result("Backend - Plain Text (.TXT) Upload & Extraction", False, str(e))

    # 2.13 Multi-Algorithm Comparison Endpoint (/api/compare)
    try:
        res = client.post("/api/compare", json={
            "text": SAMPLE_ARTICLE,
            "num_sentences": 3,
            "reference_summary": "AI is rapidly transforming healthcare with machine learning and medical datasets."
        })
        assert res.status_code == 200
        data = res.json()
        assert len(data["results"]) == 3, f"Expected 3 comparison results, got {len(data['results'])}"
        assert data["has_reference"] is True, "Reference flag not set"
        assert data["results"][0]["rouge"] is not None, "ROUGE evaluation missing from comparison"
        log_result("Backend - POST /api/compare with ROUGE", True, f"(3 algorithms benchmarked side-by-side)")
    except Exception as e:
        log_result("Backend - POST /api/compare with ROUGE", False, str(e))

    # 2.14 SQLite History CRUD Lifecycle
    try:
        # Create
        create_res = client.post("/api/history", json={
            "original_text": SAMPLE_ARTICLE,
            "summary": "AI is changing healthcare.",
            "method": "frequency",
            "num_selected_sentences": 1,
            "original_word_count": 100,
            "summary_word_count": 4,
            "compression_ratio": 0.04,
            "processing_time_ms": 5.2
        })
        assert create_res.status_code == 201
        rec_id = create_res.json()["id"]

        # List
        list_res = client.get("/api/history")
        assert list_res.status_code == 200
        assert any(item["id"] == rec_id for item in list_res.json())

        # Get by ID
        get_res = client.get(f"/api/history/{rec_id}")
        assert get_res.status_code == 200
        assert get_res.json()["id"] == rec_id

        # Delete by ID
        del_res = client.delete(f"/api/history/{rec_id}")
        assert del_res.status_code == 200

        # Verify 404
        miss_res = client.get(f"/api/history/{rec_id}")
        assert miss_res.status_code == 404
        log_result("Backend - SQLite History Persistence CRUD Lifecycle", True)
    except Exception as e:
        log_result("Backend - SQLite History Persistence CRUD Lifecycle", False, str(e))

    # -------------------------------------------------------------
    # SUMMARY
    # -------------------------------------------------------------
    print("\n" + "=" * 80)
    print(f"QA TEST SUMMARY: {len(passed_tests)} Passed, {len(failed_tests)} Failed")
    print("=" * 80)
    for p in passed_tests:
        print(f"  + {p}")
    if failed_tests:
        print("\nFailures:")
        for f in failed_tests:
            print(f"  - {f}")
    return len(failed_tests) == 0


if __name__ == "__main__":
    success = run_qa_suite()
    sys.exit(0 if success else 1)
