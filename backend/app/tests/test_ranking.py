"""
Unit Tests for Ranking, Top-K Selection, and Order Restoration
==============================================================
"""

import unittest
from backend.app.services.ranking import RankingService


class TestRanking(unittest.TestCase):

    def test_ranking_and_order_restoration(self):
        scored_sentences = [
            {"id": 1, "text": "First sentence with medium importance.", "score": 0.5},
            {"id": 2, "text": "Second sentence with highest importance.", "score": 0.95},
            {"id": 3, "text": "Third sentence with lowest importance.", "score": 0.1},
            {"id": 4, "text": "Fourth sentence with second highest importance.", "score": 0.8},
        ]

        summary, annotated = RankingService.rank_and_select(scored_sentences, num_sentences=2)

        # Check ranks
        rank_dict = {item["id"]: item["rank"] for item in annotated}
        self.assertEqual(rank_dict[2], 1)  # id 2 has highest score 0.95 -> Rank 1
        self.assertEqual(rank_dict[4], 2)  # id 4 has score 0.8 -> Rank 2

        # Check selection
        selected_ids = [item["id"] for item in annotated if item["selected"]]
        self.assertEqual(selected_ids, [2, 4])

        # Check summary restored to chronological order (Sentence 2 then Sentence 4)
        self.assertEqual(
            summary,
            "Second sentence with highest importance. Fourth sentence with second highest importance."
        )

    def test_ranking_edge_cases(self):
        # Empty input
        summary, annotated = RankingService.rank_and_select([], num_sentences=2)
        self.assertEqual(summary, "")
        self.assertEqual(annotated, [])

        # K greater than sentence count
        single = [{"id": 1, "text": "Only one sentence.", "score": 1.0}]
        summary, annotated = RankingService.rank_and_select(single, num_sentences=5)
        self.assertEqual(summary, "Only one sentence.")
        self.assertEqual(len(annotated), 1)
        self.assertTrue(annotated[0]["selected"])


if __name__ == "__main__":
    unittest.main()
