import sys
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, '.')

from backend.app.services.preprocessing import Preprocessor
from backend.app.services.frequency_summarizer import FrequencySummarizer
from backend.app.services.tfidf_summarizer import TfidfSummarizer
from backend.app.services.hybrid_summarizer import HybridSummarizer
from backend.app.services.ranking import RankingService

raw_text = """भारतीय अंतरिक्ष अनुसंधान संगठन भारत की राष्ट्रीय अंतरिक्ष एजेंसी है। इसका मुख्यालय बेंगलुरु में स्थित है और यह अंतरिक्ष विभाग के तत्वावधान में संचालित होता है। इसरो का मुख्य उद्देश्य अंतरिक्ष विज्ञान अनुसंधान और उपग्रह प्रौद्योगिकी का उपयोग राष्ट्र निर्माण के लिए करना है। भारत ने चंद्रयान और मंगलयान जैसे ऐतिहासिक अभियानों को कम लागत में सफलतापूर्वक अंजाम दिया है। भविष्य में गगनयान मिशन के तहत भारतीय अंतरिक्ष यात्रियों को अंतरिक्ष में भेजने की तैयारी चल रही है।"""

cleaned = Preprocessor.clean_text(raw_text)
print(f"Cleaned text: {repr(cleaned)}")
sents = Preprocessor.segment_sentences(cleaned)
print(f"Segmented sentences count: {len(sents)}")
for i, s in enumerate(sents):
    print(f"[{i+1}] {repr(s)}")

doc_tokens = Preprocessor.tokenize_and_normalize(cleaned)
print(f"Doc tokens: {doc_tokens}")
word_weights = FrequencySummarizer.calculate_word_frequencies(doc_tokens)
print(f"Word weights: {word_weights}")

scored = HybridSummarizer.score_sentences(sents, word_weights, 0.5, 0.5)
print(f"Scored sentences: {scored}")

summary, ann = RankingService.rank_and_select(scored, 3)
print(f"Summary with 3: {summary}")
print(f"Annotated: {ann}")
