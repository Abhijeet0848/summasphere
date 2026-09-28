# Testing Documentation & Verification Procedures

## Quality Assurance & Automated Test Framework

---

### 1. Test Architecture

The testing framework employs Python's `pytest` and `unittest` with FastAPI's `TestClient` (Starlette) to achieve full test coverage across the NLP engines, API endpoints, error handlers, and persistence layer.

```
backend/app/tests/
├── test_preprocessing.py      # Cleaning, segmentation, tokenization, lemmatization
├── test_summarizers.py        # Frequency, TF-IDF, and Hybrid mathematical scoring
├── test_ranking.py            # Rank assignment, Top-K selection, chronological reordering
├── test_statistics.py         # Word counts, sentence counts, compression ratio, latency
├── test_document_parser.py    # In-memory TXT and PDF ingestion, extension checks
├── test_history.py            # SQLite CRUD operations and 404 error handling
├── test_api.py                # End-to-end FastAPI endpoint integration
└── qa_comprehensive_pass.py   # Comprehensive 23-point system validation
```

---

### 2. Running Automated Tests

#### A. Run Full Pytest Suite
```bash
python -m pytest backend/app/tests
```

#### B. Run Comprehensive QA Pass
```bash
python -m backend.app.tests.qa_comprehensive_pass
```

#### C. Run Specific Test Module
```bash
python -m pytest backend/app/tests/test_summarizers.py -v
```

---

### 3. Test Cases & Verification Matrix

| Category | Test Case | Target / Assertion | Status |
| :--- | :--- | :--- | :---: |
| **NLP** | `test_segmentation` | Splits sentences on terminal `.!?` with correct sentence count | **PASS** |
| **NLP** | `test_tokenization` | Extracts clean alphanumeric lowercase tokens | **PASS** |
| **NLP** | `test_stopword_removal` | Eliminates functional terms (`the`, `is`, `a`) | **PASS** |
| **NLP** | `test_lemmatization` | Reduces inflections (`records` $\rightarrow$ `record`) | **PASS** |
| **NLP** | `test_frequency_weighting`| Normalizes frequencies $\in [0.0, 1.0]$ | **PASS** |
| **NLP** | `test_tfidf_scoring` | Generates non-negative TF-IDF scores with IDF smoothing | **PASS** |
| **NLP** | `test_hybrid_scoring` | Computes $\alpha \cdot \text{Freq} + \beta \cdot \text{TF-IDF}$ correctly | **PASS** |
| **NLP** | `test_chronological_order` | Output summary follows original sentence index sequence | **PASS** |
| **Backend** | `test_health_endpoint` | `GET /api/health` returns status `200` and `"healthy"` | **PASS** |
| **Backend** | `test_summarize_frequency` | `POST /api/summarize` returns 3 sentences with telemetry | **PASS** |
| **Backend** | `test_summarize_tfidf` | `POST /api/summarize` generates valid TF-IDF summary | **PASS** |
| **Backend** | `test_invalid_method` | Unknown method returns HTTP `422 Unprocessable Content` | **PASS** |
| **Backend** | `test_empty_input` | Empty string returns HTTP `422 Unprocessable Content` | **PASS** |
| **Backend** | `test_short_input` | Text $< 10$ chars returns HTTP `422 Unprocessable Content` | **PASS** |
| **Backend** | `test_clamped_sentence_k` | Requested $K > N$ clamps safely to total available sentences | **PASS** |
| **Parser** | `test_txt_extraction` | Ingests `.txt` files in RAM and extracts full text | **PASS** |
| **Parser** | `test_invalid_extension` | Rejects `.exe` / `.bin` with HTTP `400 Bad Request` | **PASS** |
| **Parser** | `test_corrupt_pdf` | Corrupt PDF returns graceful HTTP `422` error | **PASS** |
| **History** | `test_sqlite_crud` | Verifies `POST`, `GET`, `GET/{id}`, `DELETE/{id}` | **PASS** |
| **Benchmark**| `test_compare_endpoint` | `POST /api/compare` runs 3 algorithms + ROUGE evaluation | **PASS** |
