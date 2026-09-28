"""
Accuracy & Performance Benchmark Suite for Extractive Summarizers
==================================================================
Evaluates Word Frequency, TF-IDF, and TextRank algorithms across
curated multi-domain test cases against human reference summaries
using ROUGE-1, ROUGE-2, and ROUGE-L metrics.
"""

import json
from extractive_summarizer import ExtractiveSummarizer

# Multi-domain benchmark dataset with human gold-standard summaries
BENCHMARK_DATASET = [
    {
        "id": "AI_NLP_01",
        "domain": "Artificial Intelligence & NLP",
        "document": (
            "Natural Language Processing (NLP) is a critical branch of artificial intelligence that empowers computers to understand and generate human language. "
            "Recent advancements in deep learning, particularly transformer models like BERT and GPT, have revolutionized machine translation and text summarization. "
            "Automated text summarization is essential for condensing large volumes of textual data into concise overviews. "
            "Extractive summarization selects the most salient sentences directly from the original document without altering the text. "
            "In contrast, abstractive summarization generates entirely new sentences using sequence-to-sequence neural architectures. "
            "Extractive approaches guarantee high factual consistency and require significantly less computational power for enterprise workflows."
        ),
        "gold_reference": (
            "Natural Language Processing is a critical branch of artificial intelligence that empowers computers to understand human language. "
            "Extractive summarization selects the most salient sentences directly from the original document. "
            "Extractive approaches guarantee high factual consistency and require less computational power."
        )
    },
    {
        "id": "BIO_MED_02",
        "domain": "Biomedicine & Genetics",
        "document": (
            "CRISPR-Cas9 is a groundbreaking gene-editing technology that allows scientists to modify DNA sequences with unprecedented precision. "
            "The system utilizes a guide RNA molecule to direct the Cas9 endonuclease enzyme to a specific genomic location where it creates a double-strand break. "
            "This cellular cut stimulates the cell's natural repair mechanisms, allowing researchers to disable harmful mutations or insert beneficial genetic material. "
            "CRISPR has accelerated research into treatments for genetic disorders such as sickle cell anemia and cystic fibrosis. "
            "However, ethical concerns regarding off-target mutations and human germline editing remain significant hurdles in regulatory approval."
        ),
        "gold_reference": (
            "CRISPR-Cas9 is a groundbreaking gene-editing technology that allows scientists to modify DNA sequences with precision. "
            "CRISPR has accelerated research into treatments for genetic disorders such as sickle cell anemia. "
            "However, ethical concerns regarding off-target mutations remain significant hurdles."
        )
    },
    {
        "id": "CLIMATE_03",
        "domain": "Environmental Science",
        "document": (
            "Global climate change represents an urgent ecological and socioeconomic threat characterized by rising average planetary temperatures. "
            "The relentless accumulation of greenhouse gas emissions from fossil fuel combustion accelerates the melting of polar glaciers and thermal expansion of oceans. "
            "Rising sea levels threaten coastal cities and delicate marine ecosystems around the world. "
            "Deploying renewable energy technologies like solar and wind power is critical for rapid global decarbonization. "
            "International climate agreements provide vital legal frameworks to enforce emission reduction targets across industrialized nations."
        ),
        "gold_reference": (
            "Global climate change represents an urgent ecological threat characterized by rising planetary temperatures. "
            "Deploying renewable energy technologies like solar and wind power is critical for global decarbonization. "
            "International climate agreements provide vital frameworks to enforce emission reduction targets."
        )
    }
]


def run_accuracy_benchmark():
    summarizer = ExtractiveSummarizer()
    algorithms = ["frequency", "tfidf", "textrank"]

    results = {algo: {"r1": [], "r2": [], "rl": []} for algo in algorithms}

    print("=" * 80)
    print("EXTRACTIVE TEXT SUMMARIZER: ACCURACY & ROUGE BENCHMARK SUITE")
    print("=" * 80)

    for case in BENCHMARK_DATASET:
        print(f"\nEvaluating Case: [{case['id']}] {case['domain']}")
        print("-" * 80)

        for algo in algorithms:
            res = summarizer.summarize(case["document"], algorithm=algo, top_n=3)
            candidate = res["summary"]
            scores = summarizer.calculate_rouge(candidate, case["gold_reference"])

            results[algo]["r1"].append(scores["rouge-1"]["f1"])
            results[algo]["r2"].append(scores["rouge-2"]["f1"])
            results[algo]["rl"].append(scores["rouge-l"]["f1"])

            print(f"  Algorithm: {algo.upper():10} | ROUGE-1 F1: {scores['rouge-1']['f1']*100:5.1f}% | ROUGE-2 F1: {scores['rouge-2']['f1']*100:5.1f}% | ROUGE-L F1: {scores['rouge-l']['f1']*100:5.1f}%")

    print("\n" + "=" * 80)
    print("OVERALL AGGREGATED ACCURACY BENCHMARK SUMMARY")
    print("=" * 80)
    print(f"{'Algorithm':<16} | {'Avg ROUGE-1 F1':<18} | {'Avg ROUGE-2 F1':<18} | {'Avg ROUGE-L F1':<18}")
    print("-" * 80)

    summary_stats = {}
    for algo in algorithms:
        avg_r1 = sum(results[algo]["r1"]) / len(results[algo]["r1"])
        avg_r2 = sum(results[algo]["r2"]) / len(results[algo]["r2"])
        avg_rl = sum(results[algo]["rl"]) / len(results[algo]["rl"])
        summary_stats[algo] = {
            "avg_rouge1_f1": round(avg_r1, 4),
            "avg_rouge2_f1": round(avg_r2, 4),
            "avg_rouge_l_f1": round(avg_rl, 4)
        }
        print(f"{algo.upper():<16} | {avg_r1*100:14.2f}%    | {avg_r2*100:14.2f}%    | {avg_rl*100:14.2f}%")

    print("=" * 80)
    return summary_stats


if __name__ == "__main__":
    run_accuracy_benchmark()
