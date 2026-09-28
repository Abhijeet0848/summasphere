"""
Sentence Ranking and Chronological Selection Module
===================================================
Handles:
1. Sentence Ranking: Sorts sentences descending by calculated importance score (Rank 1 = Highest Score).
2. Top-K Selection: Filters the top K most informative sentences.
3. Original Order Restoration: Re-sorts selected sentences by their original chronological document position (Sentence ID).
4. Summary Synthesis: Concatenates chosen sentences into a coherent final extractive summary.
"""

from typing import List, Dict, Any, Tuple


class RankingService:
    """Manages sentence ranking and chronological order preservation."""

    @staticmethod
    def rank_and_select(
        scored_sentences: List[Dict[str, Any]],
        num_sentences: int = 3
    ) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Executes:
        1. Sorts descending by score to assign integer rank (1 to N).
        2. Selects Top-K highest-ranked sentence IDs.
        3. Annotates all sentences with rank and selection flag.
        4. Restores selected sentences back to their original document sequence.
        5. Joins selected sentences to form the finalized summary text.
        
        Args:
            scored_sentences: List of dicts with 'id', 'text', 'score'
            num_sentences: Target count (K) of sentences to extract
            
        Returns:
            Tuple of (summary_text, annotated_sentences_list)
        """
        if not scored_sentences:
            return "", []

        total_count = len(scored_sentences)
        k = min(max(1, num_sentences), total_count)

        # 1. Rank sentences by score descending (tie-breaker by original ID)
        sorted_by_score = sorted(
            scored_sentences,
            key=lambda x: (x["score"], -x["id"]),
            reverse=True
        )

        # Build rank map (1-indexed, 1 is highest priority)
        rank_map = {}
        for rank_idx, item in enumerate(sorted_by_score):
            rank_map[item["id"]] = rank_idx + 1

        # Select Top-K IDs
        top_k_ids = set(item["id"] for item in sorted_by_score[:k])

        # 2. Annotate full sentence list with rank and selection status
        annotated_sentences = []
        for item in scored_sentences:
            is_selected = item["id"] in top_k_ids
            annotated_sentences.append({
                "id": item["id"],
                "text": item["text"],
                "score": item["score"],
                "rank": rank_map[item["id"]],
                "selected": is_selected,
                "token_count": item.get("token_count", 0)
            })

        # 3. Restore selected sentences to original chronological document order
        selected_in_order = [
            item for item in annotated_sentences if item["selected"]
        ]
        # Strictly sort by original ID (1, 2, 3...)
        selected_in_order.sort(key=lambda x: x["id"])

        # 4. Construct final extractive summary (each sentence on a new line)
        summary = "\n".join(item["text"].strip() for item in selected_in_order)

        return summary, annotated_sentences
