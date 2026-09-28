"""
NLP Preprocessing Pipeline Module (Multilingual: English & Hindi)
==================================================================
Provides explicit, modular text transformation steps for Extractive Summarization:
1. Text Ingestion & Cleaning (HTML entity decoding, tag removal, whitespace standardization)
2. Sentence Segmentation (Boundary detection supporting Western . ! ? and Hindi । ॥)
3. Word Tokenization (Isolating individual alphanumeric and Devanagari tokens)
4. Lowercasing & Unicode Normalization
5. Stop-word Removal (Filtering non-salient terms in English and Hindi)
6. Morphological Lemmatization & Stemming (WordNet/affix rules for EN, morphological suffix stripper for HI)

Preserves original sentence text and position indices to guarantee 100% factual fidelity.
"""

import re
import html
from typing import List, Dict, Set, Any

# Curated English stop words list
ENGLISH_STOP_WORDS: Set[str] = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
    "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't",
    "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during",
    "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have",
    "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers",
    "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm",
    "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's",
    "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off",
    "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out",
    "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should",
    "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their",
    "theirs", "them", "themselves", "then", "there", "there's", "these", "they",
    "they'd", "they'll", "they're", "they've", "this", "those", "through", "to",
    "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll",
    "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where",
    "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with",
    "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've",
    "your", "yours", "yourself", "yourselves"
}

# Curated Hindi stop words list
HINDI_STOP_WORDS: Set[str] = {
    "के", "का", "की", "है", "हैं", "में", "से", "को", "पर", "ने", "और", "तो", "भी", "एक",
    "यह", "वह", "था", "थे", "थी", "कर", "रहा", "रहे", "रही", "दिया", "लिया", "गया", "गए",
    "गई", "होता", "होते", "होती", "किया", "किए", "इस", "उस", "कि", "लिए", "तक", "साथ",
    "बाद", "हो", "हुए", "हुआ", "हुई", "जा", "सकते", "सकता", "सकती", "अपना", "अपनी", "अपने",
    "इन", "उन", "पे", "ही", "या", "बहुत", "कुछ", "कोई", "सब", "दो", "तीन", "जब", "तब",
    "कहा", "कहे", "हुयी", "वाले", "वाली", "वाला", "द्वारा", "अनुसार", "कारण", "होने", "करना",
    "करने", "करते", "रखते", "रखता", "रखती", "रहते", "रहती", "रहता", "सकें", "सके", "सका",
    "सकी", "वे", "ये", "जिसे", "जिस", "जिन", "तिन", "तिसे", "यहाँ", "वहाँ", "कहाँ", "जहाँ",
    "कौन", "क्या", "कब", "कैसे", "कितना", "कितने", "कितनी", "पहले", "आगे", "पीछे", "ऊपर",
    "नीचे", "अंदर", "बाहर", "बीच", "पास", "दूर", "कम", "ज्यादा", "अधिक", "केवल", "मात्र",
    "दौरान", "तहत", "लेकर", "देकर", "होगा", "होगी", "होंगे", "सकेगा", "सकेगी", "सकेंगे",
    "व", "एवं", "तथा", "अथवा", "लेकिन", "किंतु", "परंतु", "मगर", "क्योंकि", "चूंकि", "ताकि"
}

# Unified stop-words set for backward compatibility
STOP_WORDS: Set[str] = ENGLISH_STOP_WORDS.union(HINDI_STOP_WORDS)

# Hindi morphological suffixes for light stemmer
HINDI_SUFFIXES: List[str] = [
    "ाइयां", "ाइयों", "ाइयाँ", "ाएं", "ाएँ", "ियों", "ियाँ", "ियां", "ाओं", "ों",
    "एं", "एँ", "े", "ी", "ा", "ने", "ना", "नी", "ते", "ता", "ती", "कर", "ाया",
    "ाये", "ाई", "करके", "पूर्वक", "दार", "वान", "कार", "ीय"
]

# Optional NLTK/WordNet integration with graceful fallback
try:
    import nltk
    from nltk.stem import WordNetLemmatizer
    _LEMMATIZER = WordNetLemmatizer()
except Exception:
    _LEMMATIZER = None


class Preprocessor:
    """Provides modular, multilingual preprocessing operations for extractive summarization."""

    @staticmethod
    def detect_language(text: str) -> str:
        """
        Detects if document is Hindi ('hi') or English ('en').
        Checks for presence of Devanagari unicode script range (\u0900-\u097F).
        """
        if not text:
            return "en"
        devanagari_chars = len(re.findall(r'[\u0900-\u097F]', text))
        latin_chars = len(re.findall(r'[a-zA-Z]', text))
        if devanagari_chars > 3 and devanagari_chars >= latin_chars * 0.3:
            return "hi"
        return "en"

    @staticmethod
    def clean_text(raw_text: str) -> str:
        r"""
        Step 1: Text Cleaning & Sanitization
        - Decodes HTML entities
        - Strips HTML/XML tags
        - Converts rich Markdown links [anchor](url) -> anchor
        - Strips citation URLs, standalone links, and reference brackets (e.g., [50], [\[50\]](http...), [6][51])
        - Normalizes irregular whitespace and special unicode characters
        """
        if not raw_text or not isinstance(raw_text, str):
            return ""
        text = html.unescape(raw_text)
        text = re.sub(r"<[^>]+>", " ", text)
        text = text.replace("\xa0", " ").replace("\u200b", "").replace("&nbsp;", " ")
        
        # 1. Strip Markdown citation links: [\[50\]](...) or [50](...)
        text = re.sub(r'\[(?:\\\[|\[)?\s*\d+\s*(?:\\\]|\])?\]\([^)]+\)', '', text)
        
        # 2. Extract anchor text from general Markdown links: [anchor](url) -> anchor
        text = re.sub(r'\[([^\[\]]+)\]\((?:\\\(|\\\)|[^)])+\)', r'\1', text)
        
        # 3. Strip standalone URLs
        text = re.sub(r'https?://\S+', '', text)
        
        # 4. Strip citation brackets: \[50\], [50], [1][2], [edit], [citation needed]
        text = re.sub(r'(?:\\\[|\[)\s*\d+\s*(?:\\\]|\])', '', text)
        text = re.sub(r'\[\s*(?:edit|citation needed|[a-zA-Z\s]+)\s*\]', '', text)
        
        # 5. Clean stray escaped characters
        text = re.sub(r'\\([\[\]\(\)])', r'\1', text)
        
        # 6. Standardize carriage returns and whitespace
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        text = re.sub(r"[ \t]+", " ", text)
        return text.strip()

    @staticmethod
    def segment_sentences(cleaned_text: str) -> List[str]:
        """
        Step 2: Sentence Boundary Segmentation (Multilingual: English . ! ? and Hindi । ॥ |)
        - Handles sentence terminals (. ! ? । ॥ |) followed by closing quotes, parentheses, brackets
        - Accurately segments both standard paragraphs and newline-separated texts
        """
        if not cleaned_text:
            return []
        
        # Normalize ASCII pipe used as Hindi danda
        normalized = re.sub(r'\s*\|\s*', '। ', cleaned_text)
        
        # Pattern captures sentence body and its terminal punctuation (. ! ? । ॥)
        pattern = r'([^.!?।॥\n]+(?:[.!?।॥]+["\'”’\)\]]*|$))'
        raw_sentences = re.findall(pattern, normalized)
        
        sentences = []
        for s in raw_sentences:
            cleaned_s = s.strip()
            if cleaned_s:
                sentences.append(cleaned_s)
                
        # If no split occurred but text has semicolons, fallback
        if len(sentences) <= 1 and ';' in cleaned_text:
            semi_splits = [s.strip() for s in cleaned_text.split(';') if s.strip()]
            if len(semi_splits) > 1:
                return semi_splits
                
        return sentences

    @staticmethod
    def tokenize(text: str) -> List[str]:
        """
        Step 3 & 4: Word Tokenization (Supports both Latin English and Devanagari Hindi)
        Excludes Devanagari sentence terminators (। \u0964 and ॥ \u0965) from word tokens.
        """
        if not text:
            return []
        # \u0900-\u0963 and \u0966-\u097F covers Devanagari letters, matras, signs, and numbers without \u0964/\u0965 (danda)
        return re.findall(r"[\u0900-\u0963\u0966-\u097Fa-zA-Z0-9'-]+", text)

    @classmethod
    def lemmatize_word(cls, word: str, lang: str = "en") -> str:
        """
        Step 6: Morphological Lemmatization / Stemming
        - English: WordNet lemmatizer + English affix rules
        - Hindi: Devanagari morphological suffix stripper
        """
        w = word.strip("'-")
        if not w:
            return ""

        # Hindi Stemmer
        if lang == "hi" or re.search(r'[\u0900-\u097F]', w):
            if len(w) <= 3:
                return w
            for suffix in HINDI_SUFFIXES:
                if w.endswith(suffix) and len(w) - len(suffix) >= 2:
                    return w[:-len(suffix)]
            return w

        # English Lemmatizer
        w_lower = w.lower()
        if _LEMMATIZER:
            try:
                return _LEMMATIZER.lemmatize(w_lower)
            except Exception:
                pass

        # English fallback rule-based morphological reduction
        if w_lower.endswith("ies") and len(w_lower) > 4:
            return w_lower[:-3] + "y"
        if w_lower.endswith("ing") and len(w_lower) > 5:
            return w_lower[:-3]
        if w_lower.endswith("ed") and len(w_lower) > 4:
            return w_lower[:-2]
        if w_lower.endswith("es") and len(w_lower) > 4:
            return w_lower[:-2]
        if w_lower.endswith("s") and len(w_lower) > 3 and not w_lower.endswith("ss"):
            return w_lower[:-1]
        return w_lower

    @classmethod
    def filter_and_lemmatize(cls, raw_tokens: List[str], lang: str = "en") -> List[str]:
        """
        Steps 5 & 6: Stop-word Removal & Lemmatization
        """
        stop_words = HINDI_STOP_WORDS if lang == "hi" else ENGLISH_STOP_WORDS
        meaningful = []
        for token in raw_tokens:
            clean = token.strip("'-")
            if clean and clean.lower() not in stop_words and clean not in stop_words and not clean.isdigit() and len(clean) > 1:
                lemma = cls.lemmatize_word(clean, lang=lang)
                if lemma and lemma.lower() not in stop_words and lemma not in stop_words:
                    meaningful.append(lemma)
        return meaningful

    @classmethod
    def tokenize_and_normalize(cls, text: str) -> List[str]:
        """
        End-to-end token pipeline: Tokenize -> Stop-word filtering -> Lemmatize
        """
        lang = cls.detect_language(text)
        raw_tokens = cls.tokenize(text)
        return cls.filter_and_lemmatize(raw_tokens, lang=lang)

    @classmethod
    def preprocess(cls, raw_text: str) -> Dict[str, Any]:
        """
        Master Preprocessing Pipeline:
        Transforms raw document into structured representation.
        """
        lang = cls.detect_language(raw_text)
        cleaned_text = cls.clean_text(raw_text)
        original_sentences = cls.segment_sentences(cleaned_text)

        processed_sentences = []
        all_meaningful_tokens = []

        for idx, sentence in enumerate(original_sentences):
            raw_tokens = cls.tokenize(sentence)
            lemmas = cls.filter_and_lemmatize(raw_tokens, lang=lang)
            all_meaningful_tokens.extend(lemmas)

            processed_sentences.append({
                "id": idx + 1,
                "original_text": sentence,
                "raw_tokens": raw_tokens,
                "tokens": lemmas,
                "lemmas": lemmas,
                "token_count": len(lemmas),
                "raw_word_count": len(raw_tokens)
            })

        return {
            "language": lang,
            "original_sentences": original_sentences,
            "processed_sentences": processed_sentences,
            "tokens": all_meaningful_tokens
        }

    @classmethod
    def get_detailed_preprocessing_analysis(cls, raw_text: str) -> Dict[str, Any]:
        """
        Generates full academic NLP preprocessing telemetry with language support.
        """
        from collections import Counter
        lang = cls.detect_language(raw_text)
        stop_words = HINDI_STOP_WORDS if lang == "hi" else ENGLISH_STOP_WORDS

        cleaned_text = cls.clean_text(raw_text)
        sentences = cls.segment_sentences(cleaned_text)
        total_sentences = len(sentences)

        all_raw_words: List[str] = []
        all_clean_lemmas: List[str] = []
        removed_words: List[str] = []
        lemma_transformations: Dict[str, str] = {}

        for s in sentences:
            tokens = cls.tokenize(s)
            all_raw_words.extend(tokens)
            for tok in tokens:
                clean = tok.strip("'-")
                if not clean or clean.isdigit() or len(clean) <= 1:
                    continue
                if clean in stop_words or clean.lower() in stop_words:
                    removed_words.append(clean)
                else:
                    lemma = cls.lemmatize_word(clean, lang=lang)
                    if lemma in stop_words or lemma.lower() in stop_words:
                        removed_words.append(clean)
                    else:
                        all_clean_lemmas.append(lemma)
                        if clean != lemma:
                            lemma_transformations[clean] = lemma

        stopword_counts = Counter(removed_words)
        removed_stopwords_list = [
            {"word": w, "count": c} for w, c in stopword_counts.most_common(30)
        ]

        lemmatization_pairs_list = [
            {"original": orig, "lemma": lem} for orig, lem in list(lemma_transformations.items())[:30]
        ]

        raw_count = len(all_raw_words)
        clean_count = len(all_clean_lemmas)
        unique_count = len(set(all_clean_lemmas))
        avg_len = round(raw_count / total_sentences, 1) if total_sentences > 0 else 0.0

        return {
            "language": lang,
            "total_sentences": total_sentences,
            "raw_words_count": raw_count,
            "clean_words_count": clean_count,
            "unique_words_count": unique_count,
            "avg_sentence_length": avg_len,
            "removed_stopwords": removed_stopwords_list,
            "lemmatization_pairs": lemmatization_pairs_list
        }

