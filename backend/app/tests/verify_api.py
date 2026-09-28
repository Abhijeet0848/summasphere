"""
API Endpoints Verification Script with Realistic Requests
=========================================================
Tests:
1. GET /api/health
2. POST /api/summarize with Frequency method
3. POST /api/summarize with TF-IDF method
4. POST /api/summarize with Hybrid method
5. Validation failures (empty text, invalid method, etc.)
"""

import json
from fastapi.testclient import TestClient
from backend.app.main import app

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


def test_api():
    print("=" * 80)
    print("FASTAPI ENDPOINTS & VALIDATION VERIFICATION")
    print("=" * 80)

    # 1. Health Check
    print("\n--- 1. Testing GET /api/health ---")
    resp = client.get("/api/health")
    print(f"Status: {resp.status_code}, Response: {resp.json()}")
    assert resp.status_code == 200
    assert resp.json() == {"status": "healthy"}

    # 2. Summarize (Frequency)
    print("\n--- 2. Testing POST /api/summarize (Method: Frequency) ---")
    payload = {
        "text": SAMPLE_ARTICLE,
        "method": "frequency",
        "num_sentences": 3
    }
    resp = client.post("/api/summarize", json=payload)
    print(f"Status: {resp.status_code}")
    data = resp.json()
    print("Response JSON snippet:")
    print(json.dumps({
        "summary": data["summary"],
        "method": data["method"],
        "sentences_count": len(data["sentences"]),
        "statistics": data["statistics"]
    }, indent=2))
    assert resp.status_code == 200
    assert data["method"] == "frequency"
    assert len(data["sentences"]) == 9
    assert data["statistics"]["summary_sentence_count"] == 3

    # 3. Summarize (TF-IDF)
    print("\n--- 3. Testing POST /api/summarize (Method: TF-IDF) ---")
    payload["method"] = "tfidf"
    resp = client.post("/api/summarize", json=payload)
    print(f"Status: {resp.status_code}")
    data = resp.json()
    print("Response JSON snippet:")
    print(json.dumps({
        "summary": data["summary"],
        "method": data["method"],
        "statistics": data["statistics"]
    }, indent=2))
    assert resp.status_code == 200
    assert data["method"] == "tfidf"

    # 4. Summarize (Hybrid)
    print("\n--- 4. Testing POST /api/summarize (Method: Hybrid) ---")
    payload["method"] = "hybrid"
    payload["weight_frequency"] = 0.6
    payload["weight_tfidf"] = 0.4
    resp = client.post("/api/summarize", json=payload)
    print(f"Status: {resp.status_code}")
    data = resp.json()
    print("Response JSON snippet:")
    print(json.dumps({
        "summary": data["summary"],
        "method": data["method"],
        "statistics": data["statistics"]
    }, indent=2))
    assert resp.status_code == 200
    assert data["method"] == "hybrid"

    # 5. Validation: Invalid Method
    print("\n--- 5. Testing Validation: Invalid Method ---")
    bad_payload = {"text": SAMPLE_ARTICLE, "method": "chatgpt"}
    resp = client.post("/api/summarize", json=bad_payload)
    print(f"Status: {resp.status_code} (Expected 422), Error: {resp.json().get('detail', [])[0]['msg']}")
    assert resp.status_code == 422

    # 6. Validation: Empty / Too Short Text
    print("\n--- 6. Testing Validation: Empty / Too Short Text ---")
    bad_payload = {"text": "short", "method": "frequency"}
    resp = client.post("/api/summarize", json=bad_payload)
    print(f"Status: {resp.status_code} (Expected 422), Error: {resp.json().get('detail', [])[0]['msg']}")
    assert resp.status_code == 422

    print("\n" + "=" * 80)
    print("ALL API ENDPOINT & VALIDATION TESTS PASSED (100% SUCCESS)")
    print("=" * 80)


if __name__ == "__main__":
    test_api()
