# REST API Documentation

## Intelligent Extractive Text Summarization System

Interactive OpenAPI documentation is automatically served at `http://localhost:8000/docs` (Swagger UI) and `http://localhost:8000/redoc`.

---

### Endpoints Overview

| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status check |
| `POST` | `/api/summarize` | Generate extractive summary for text |
| `POST` | `/api/compare` | Multi-algorithm benchmark comparison |
| `POST` | `/api/extract_document` | In-memory TXT / PDF document text extraction |
| `POST` | `/api/evaluate_rouge` | Standalone ROUGE-1, ROUGE-2, ROUGE-L evaluation |
| `POST` | `/api/history` | Save summarization record to SQLite |
| `GET` | `/api/history` | List summarization history records |
| `GET` | `/api/history/{id}` | Retrieve single history record by ID |
| `DELETE` | `/api/history/{id}` | Delete history record by ID |
| `DELETE` | `/api/history` | Clear all history records |

---

### Detailed Endpoint Specifications

#### 1. POST `/api/summarize`

**Request Body**:
```json
{
  "text": "Artificial intelligence is rapidly changing the healthcare industry. Modern AI systems can analyze large amounts of medical data in a short period of time...",
  "method": "frequency",
  "num_sentences": 3,
  "weight_frequency": 0.5,
  "weight_tfidf": 0.5,
  "save_to_history": true
}
```

**Parameters**:
- `text` (*string, required*): Document text (minimum 10 characters).
- `method` (*string, default: "frequency"*): `"frequency"`, `"tfidf"`, or `"hybrid"`.
- `num_sentences` (*integer, default: 3*): Target number of sentences ($K \ge 1$).
- `weight_frequency` (*float, optional*): Frequency weight for hybrid mode ($0.0 \dots 1.0$).
- `weight_tfidf` (*float, optional*): TF-IDF weight for hybrid mode ($0.0 \dots 1.0$).
- `save_to_history` (*boolean, optional*): Whether to persist to SQLite.

**Success Response (`200 OK`)**:
```json
{
  "summary": "Modern AI systems can analyze large amounts of medical data in a short period of time. Researchers are using machine learning algorithms to identify patterns in medical images and patient records. The use of artificial intelligence in healthcare is expected to continue growing as computing power and medical datasets become more widely available.",
  "method": "frequency",
  "original_text": "Artificial intelligence is rapidly changing...",
  "sentences": [
    {
      "id": 1,
      "text": "Artificial intelligence is rapidly changing the healthcare industry.",
      "score": 0.5342,
      "rank": 4,
      "selected": false,
      "token_count": 5,
      "raw_tokens": ["artificial", "intelligence", "is", "rapidly", "changing", "the", "healthcare", "industry"],
      "filtered_tokens": ["artificial", "intelligence", "rapidly", "changing", "healthcare", "industry"],
      "lemmas": ["artificial", "intelligence", "rapidly", "change", "healthcare", "industry"]
    }
  ],
  "word_frequencies": {
    "healthcare": 3,
    "intelligence": 2,
    "system": 2
  },
  "statistics": {
    "original_sentence_count": 9,
    "summary_sentence_count": 3,
    "original_word_count": 105,
    "summary_word_count": 48,
    "compression_ratio": 0.4571,
    "processing_time_ms": 4.71
  },
  "original_sentence_count": 9,
  "summary_sentence_count": 3,
  "original_word_count": 105,
  "summary_word_count": 48,
  "compression_ratio": 0.4571,
  "processing_time_ms": 4.71
}
```

---

#### 2. POST `/api/compare`

Runs Frequency, TF-IDF, and Hybrid models on the same document and computes optional ROUGE scores.

**Request Body**:
```json
{
  "text": "Article text here...",
  "num_sentences": 3,
  "reference_summary": "Optional gold-standard human reference summary..."
}
```

---

#### 3. POST `/api/extract_document`

Uploads and extracts plain text from TXT or PDF documents in RAM without disk storage.

**Request (Multipart Form Data)**:
- `file`: Document file (`.txt`, `.pdf`, `.md` up to 10 MB).

**Response (`200 OK`)**:
```json
{
  "filename": "clinical_study.pdf",
  "extension": ".pdf",
  "text": "Extracted text content...",
  "word_count": 450,
  "sentence_count": 22,
  "file_size_bytes": 1048576
}
```

---

#### 4. SQLite History APIs (`/api/history`)

- **POST `/api/history`**: Saves a history record (`201 Created`).
- **GET `/api/history?limit=50`**: Lists recent records (`200 OK`).
- **GET `/api/history/{id}`**: Retrieves single record (`200 OK` or `404 Not Found`).
- **DELETE `/api/history/{id}`**: Deletes record by ID (`200 OK`).
- **DELETE `/api/history`**: Clears all records (`200 OK`).
