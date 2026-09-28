"""
Unit & Integration Tests for SQLite History Persistence
======================================================
"""

import unittest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


class TestHistoryAPI(unittest.TestCase):

    def test_history_crud_lifecycle(self):
        # 1. Create a history record via POST /api/history
        payload = {
            "original_text": "Natural Language Processing allows machines to summarize text efficiently.",
            "summary": "Natural Language Processing allows machines to summarize text efficiently.",
            "method": "frequency",
            "num_selected_sentences": 1,
            "original_word_count": 9,
            "summary_word_count": 9,
            "compression_ratio": 1.0,
            "processing_time_ms": 3.45
        }
        create_resp = client.post("/api/history", json=payload)
        self.assertEqual(create_resp.status_code, 201)
        created_data = create_resp.json()
        record_id = created_data["id"]
        self.assertEqual(created_data["method"], "frequency")
        self.assertEqual(created_data["num_selected_sentences"], 1)

        # 2. Retrieve history list via GET /api/history
        list_resp = client.get("/api/history")
        self.assertEqual(list_resp.status_code, 200)
        history_list = list_resp.json()
        self.assertTrue(len(history_list) > 0)
        self.assertTrue(any(item["id"] == record_id for item in history_list))

        # 3. Retrieve single record via GET /api/history/{id}
        get_resp = client.get(f"/api/history/{record_id}")
        self.assertEqual(get_resp.status_code, 200)
        item_data = get_resp.json()
        self.assertEqual(item_data["id"], record_id)
        self.assertEqual(item_data["original_word_count"], 9)
        self.assertIn("Natural Language Processing", item_data["original_text"])

        # 4. Delete single record via DELETE /api/history/{id}
        del_resp = client.delete(f"/api/history/{record_id}")
        self.assertEqual(del_resp.status_code, 200)
        self.assertEqual(del_resp.json(), {"status": "deleted", "id": record_id})

        # 5. Verify 404 when retrieving deleted record
        missing_resp = client.get(f"/api/history/{record_id}")
        self.assertEqual(missing_resp.status_code, 404)


if __name__ == "__main__":
    unittest.main()
