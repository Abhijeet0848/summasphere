import React, { useState } from 'react';

const COMMON_STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself',
  'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most',
  'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our',
  'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than',
  'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this',
  'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when',
  'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours', 'yourself'
]);

export default function NLPAnalysis({ summaryData, originalText }) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'sentences' | 'tokens' | 'stopwords' | 'lemmas'

  if (!summaryData) return null;

  const sentences = summaryData.sentences || [];
  const prepMeta = summaryData.preprocessing_meta || {};
  const wordFreqs = summaryData.word_frequencies || {};

  const totalSentences = prepMeta.total_sentences || sentences.length;
  const rawWordsCount = prepMeta.raw_words_count || (originalText ? originalText.trim().split(/\s+/).length : 0);
  const cleanWordsCount = prepMeta.clean_words_count || Object.values(wordFreqs).reduce((a, b) => a + b, 0);

  // Dynamic fallback for removed stopwords
  let removedStopwords = prepMeta.removed_stopwords || [];
  if (removedStopwords.length === 0 && originalText) {
    const tokens = originalText.toLowerCase().match(/[\u0900-\u0963\u0966-\u097Fa-zA-Z0-9'-]+/g) || [];
    const stopCount = {};
    for (const t of tokens) {
      if (COMMON_STOP_WORDS.has(t)) {
        stopCount[t] = (stopCount[t] || 0) + 1;
      }
    }
    removedStopwords = Object.entries(stopCount)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);
  }

  // Dynamic fallback for lemmatization pairs
  let lemmatizationPairs = prepMeta.lemmatization_pairs || [];
  if (lemmatizationPairs.length === 0 && originalText) {
    const tokens = originalText.toLowerCase().match(/[\u0900-\u0963\u0966-\u097Fa-zA-Z0-9'-]+/g) || [];
    const pairsMap = new Map();
    for (const t of tokens) {
      if (COMMON_STOP_WORDS.has(t) || t.length < 4) continue;
      if (t.endsWith('ies') && t.length > 4) {
        pairsMap.set(t, t.slice(0, -3) + 'y');
      } else if (t.endsWith('ing') && t.length > 5) {
        pairsMap.set(t, t.slice(0, -3));
      } else if (t.endsWith('ed') && t.length > 4) {
        pairsMap.set(t, t.slice(0, -2));
      } else if (t.endsWith('es') && t.length > 4) {
        pairsMap.set(t, t.slice(0, -2));
      } else if (t.endsWith('s') && t.length > 3 && !t.endsWith('ss')) {
        pairsMap.set(t, t.slice(0, -1));
      }
    }
    lemmatizationPairs = Array.from(pairsMap.entries())
      .map(([original, lemma]) => ({ original, lemma }))
      .slice(0, 30);
  }

  const uniqueWordsCount = prepMeta.unique_words_count || Object.keys(wordFreqs).length;
  const avgSentenceLength = prepMeta.avg_sentence_length || (totalSentences > 0 ? (rawWordsCount / totalSentences).toFixed(1) : 0);

  // Collect raw tokens from sentences
  const sampleRawTokens = sentences.length > 0
    ? sentences.slice(0, 3).flatMap(s => s.raw_tokens || (s.text ? s.text.toLowerCase().match(/[\u0900-\u0963\u0966-\u097Fa-zA-Z0-9'-]+/g) || [] : [])).slice(0, 35)
    : (originalText ? originalText.toLowerCase().match(/[\u0900-\u0963\u0966-\u097Fa-zA-Z0-9'-]+/g)?.slice(0, 35) || [] : []);

  const detectedLang = prepMeta.language || summaryData.detected_language || (/[\u0900-\u097F]/.test(originalText || '') ? 'hi' : 'en');

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-lg">🔬</span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              NLP Analysis
            </h2>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
              detectedLang === 'hi'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              {detectedLang === 'hi' ? '🇮🇳 Hindi (हिंदी)' : '🌐 English (EN)'}
            </span>
          </div>
          <p className="text-xs sm:text-sm font-normal text-slate-600">
            View tokenization, stop-words filtering, and root words for your document.
          </p>
        </div>

        {/* Navigation Filter */}
        <div className="flex bg-slate-200/80 p-1 rounded-xl border border-slate-300 text-xs gap-1 flex-wrap">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all ${
              activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('sentences')}
            className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all ${
              activeTab === 'sentences' ? 'bg-white text-blue-800 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sentences
          </button>
          <button
            onClick={() => setActiveTab('tokens')}
            className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all ${
              activeTab === 'tokens' ? 'bg-white text-indigo-800 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Word Tokens
          </button>
          <button
            onClick={() => setActiveTab('stopwords')}
            className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all ${
              activeTab === 'stopwords' ? 'bg-white text-amber-800 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Stop-words ({removedStopwords.length})
          </button>
          <button
            onClick={() => setActiveTab('lemmas')}
            className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all ${
              activeTab === 'lemmas' ? 'bg-white text-emerald-800 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Root Words
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 text-center shadow-xs">
          <div className="text-xs font-medium text-slate-600 mb-1">Total Sentences</div>
          <div className="text-xl font-bold text-blue-700 font-mono">{totalSentences}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 text-center shadow-xs">
          <div className="text-xs font-medium text-slate-600 mb-1">Words (Before / After)</div>
          <div className="text-sm sm:text-base font-bold text-slate-900 font-mono">
            {rawWordsCount} <span className="text-slate-400">→</span> <span className="text-emerald-700">{cleanWordsCount}</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 text-center shadow-xs">
          <div className="text-xs font-medium text-slate-600 mb-1">Unique Vocabulary</div>
          <div className="text-xl font-bold text-indigo-700 font-mono">{uniqueWordsCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 text-center shadow-xs">
          <div className="text-xs font-medium text-slate-600 mb-1">Avg Sentence Length</div>
          <div className="text-xl font-bold text-violet-700 font-mono">{avgSentenceLength} <span className="text-xs font-normal text-slate-500">words</span></div>
        </div>
      </div>

      {/* 1. Sentence Tokenization Stage */}
      {(activeTab === 'all' || activeTab === 'sentences') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-800 font-bold text-xs flex items-center justify-center border border-blue-200">1</span>
              <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                Sentence Tokenization (Segmentation)
              </h3>
            </div>
            <span className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
              Sentences: <strong>{totalSentences}</strong>
            </span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {sentences.map((s) => (
              <div key={s.id} className="p-3 bg-slate-50 hover:bg-slate-100/60 border border-slate-200 rounded-xl text-xs sm:text-sm flex gap-3 items-start transition-colors">
                <span className="font-mono font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-xs shrink-0">
                  Sentence {s.id}
                </span>
                <span className="text-slate-800 leading-relaxed font-normal">{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Word Tokenization Stage */}
      {(activeTab === 'all' || activeTab === 'tokens') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-800 font-bold text-xs flex items-center justify-center border border-indigo-200">2</span>
              <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                Word Tokenization & Lowercasing
              </h3>
            </div>
            <span className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
              Total Raw Tokens: <strong>{rawWordsCount}</strong>
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-xs font-semibold text-slate-800 mb-1.5">Document Token Stream (Preview):</div>
              <div className="font-mono text-xs sm:text-sm text-slate-800 bg-white p-3 rounded-lg border border-slate-200 break-words font-normal leading-relaxed">
                [{sampleRawTokens.map((t) => `"${t}"`).join(', ')}{sampleRawTokens.length < rawWordsCount ? ', ...' : ''}]
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {sentences.slice(0, 5).map((s) => (
                <div key={s.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <div className="font-mono font-semibold text-indigo-800 mb-1">Sentence {s.id} Tokens:</div>
                  <div className="font-mono text-slate-800 bg-white p-2 rounded border border-slate-200 break-words font-normal">
                    [{(s.raw_tokens || []).map(t => `"${t}"`).join(', ')}]
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Stop-word Removal Stage */}
      {(activeTab === 'all' || activeTab === 'stopwords') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-800 font-bold text-xs flex items-center justify-center border border-amber-200">3</span>
              <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                Stop-word Removal
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-700 bg-amber-50/70 border border-amber-200 px-3 py-1 rounded-lg">
                Before: <strong>{rawWordsCount}</strong> words &bull; After: <strong className="text-emerald-700">{cleanWordsCount}</strong> words
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm font-normal text-slate-600">
            Removed high-frequency functional words (articles, prepositions, auxiliary verbs) with no semantic discriminatory power:
          </p>

          {removedStopwords.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-xl">
              {removedStopwords.map((item) => (
                <span
                  key={item.word}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-white border border-slate-200 text-slate-800 shadow-2xs"
                >
                  <span className="text-red-500 font-bold">✕</span>
                  <span>{item.word}</span>
                  <span className="text-[10px] font-normal bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full">
                    {item.count}
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-xl text-xs font-normal text-slate-500 text-center">
              No common stop-words detected in text.
            </div>
          )}
        </div>
      )}

      {/* 4. Lemmatization Stage */}
      {(activeTab === 'all' || activeTab === 'lemmas') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-200">4</span>
              <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                Morphological Lemmatization (Root Words)
              </h3>
            </div>
            <span className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
              Unique Lemmas: <strong>{uniqueWordsCount}</strong>
            </span>
          </div>

          <p className="text-xs sm:text-sm font-normal text-slate-600">
            Transforms inflected words to dictionary canonical root forms:
          </p>

          {lemmatizationPairs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
              {lemmatizationPairs.map((pair, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-mono">
                  <span className="font-normal text-slate-600 line-through decoration-slate-400">{pair.original}</span>
                  <span className="text-emerald-600 font-bold mx-2">→</span>
                  <span className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    {pair.lemma}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-500 text-center">
              No inflected words found requiring root lemma transformation in this text.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
