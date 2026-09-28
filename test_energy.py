import sys
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, '.')
from backend.app.services.preprocessing import Preprocessor
from backend.app.services.frequency_summarizer import FrequencySummarizer
from backend.app.services.tfidf_summarizer import TfidfSummarizer
from backend.app.services.hybrid_summarizer import HybridSummarizer
from backend.app.services.ranking import RankingService
from backend.app.services.evaluation import RougeEvaluator

text = """Solar and wind energy have become the fastest-growing sources of electricity generation worldwide. Technological advancements and economies of scale have significantly lowered the cost of solar panels over the past decade. Despite these advancements, the intermittent nature of renewable energy requires robust grid-scale battery storage solutions. Governments across the globe are providing policy incentives to accelerate the transition away from fossil fuels. A modern energy infrastructure will enhance global sustainability and reduce carbon emissions significantly."""

cleaned = Preprocessor.clean_text(text)
sents = Preprocessor.segment_sentences(cleaned)
tokens = Preprocessor.tokenize_and_normalize(cleaned)
word_weights = FrequencySummarizer.calculate_word_frequencies(tokens)

print("ORIGINAL SENTENCES:")
for i, s in enumerate(sents):
    toks = Preprocessor.tokenize(s)
    print(f"[{i+1}] ({len(toks)} words) {s}")

for k in [1, 2, 3]:
    print(f"\n=== TARGET LENGTH: {k} SENTENCE(S) ===")
    for m in ['frequency', 'tfidf', 'hybrid']:
        if m == 'frequency':
            scored = FrequencySummarizer.score_sentences(sents, word_weights)
        elif m == 'tfidf':
            scored = TfidfSummarizer.score_sentences(sents)
        else:
            scored = HybridSummarizer.score_sentences(sents, word_weights, 0.5, 0.5)
        sum_text, ann = RankingService.rank_and_select(scored, k)
        sel = [s['id'] for s in ann if s.get('selected')]
        print(f"{m.upper()} -> Selected {sel} ({len(Preprocessor.tokenize(sum_text))} words): \"{sum_text}\"")
