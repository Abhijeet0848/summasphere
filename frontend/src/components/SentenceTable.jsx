import React, { useState } from 'react';

export default function SentenceTable({ sentences }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'selected'
  const [selectedSentenceForModal, setSelectedSentenceForModal] = useState(null);

  if (!sentences || sentences.length === 0) return null;

  const filteredSentences = filter === 'selected'
    ? sentences.filter((s) => s.selected)
    : sentences;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📋</span>
              <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                Sentence Scoring & Ranking Matrix
              </h3>
            </div>
            <p className="text-xs sm:text-sm font-normal text-slate-600 mt-0.5">
              Calculated NLP sentence scores determining extractive selection.
            </p>
          </div>

          {/* Filter Toggle */}
          <div className="flex bg-slate-200/80 p-1 rounded-xl border border-slate-300 text-xs gap-1 self-start sm:self-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Sentences ({sentences.length})
            </button>
            <button
              onClick={() => setFilter('selected')}
              className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all ${
                filter === 'selected'
                  ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🟢 Selected ({sentences.filter((s) => s.selected).length})
            </button>
          </div>
        </div>

        {/* Multi-Feature Matrix Table */}
        <div className="overflow-x-auto w-full max-w-full">
          <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[650px]">
            <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold sticky top-0">
              <tr>
                <th className="py-3 px-3 w-16 text-center font-semibold">Sentence</th>
                <th className="py-3 px-3 w-16 text-center font-semibold">Rank</th>
                <th className="py-3 px-3 min-w-[280px] font-semibold">Sentence Text</th>
                <th className="py-3 px-3 w-20 text-right font-semibold text-slate-700">Tokens</th>
                <th className="py-3 px-3 w-24 text-right font-semibold text-indigo-900">Frequency</th>
                <th className="py-3 px-3 w-24 text-right font-semibold text-blue-900">TF-IDF</th>
                <th className="py-3 px-3 w-24 text-right font-semibold text-slate-900 bg-slate-200/50">Final Score</th>
                <th className="py-3 px-3 w-32 text-center font-semibold">Status</th>
                <th className="py-3 px-3 w-24 text-center font-semibold">Explain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {filteredSentences.map((s) => {
                const tokenCount = s.token_count || (s.raw_tokens ? s.raw_tokens.length : s.text.trim().split(/\s+/).length);
                const freqVal = s.freq_score !== undefined ? s.freq_score : (s.frequency_score !== undefined ? s.frequency_score : s.score);
                const tfidfVal = s.tfidf_score !== undefined ? s.tfidf_score : null;

                return (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedSentenceForModal(s)}
                    className={`hover:bg-blue-50/50 transition-colors cursor-pointer ${
                      s.selected ? 'bg-emerald-50/40' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-mono text-center font-semibold text-blue-800">
                      S{s.id}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block font-mono text-xs font-semibold px-2 py-0.5 rounded-md ${
                          s.rank <= 3
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        #{s.rank}
                      </span>
                    </td>
                    <td className="py-3 px-3 leading-relaxed font-normal text-slate-800 max-w-xs sm:max-w-md truncate">
                      {s.text}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium text-slate-600">
                      {tokenCount}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium text-indigo-700">
                      {freqVal.toFixed(4)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium text-blue-700">
                      {tfidfVal !== null ? tfidfVal.toFixed(4) : '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 bg-slate-100/50">
                      {s.score.toFixed(4)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {s.selected ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                          <span>Selected</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-normal text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          <span>Not selected</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSentenceForModal(s);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition-all duration-150 cursor-pointer active:scale-95"
                      >
                        <span>🔍</span>
                        <span>Why?</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* "Why was this sentence selected?" Explainable NLP Modal */}
      {selectedSentenceForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
              <div className="flex items-center gap-2">
                <span className="text-xl">💡</span>
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                    Why was Sentence {selectedSentenceForModal.id} {selectedSentenceForModal.selected ? 'Selected' : 'Scored'}?
                  </h3>
                  <p className="text-xs text-slate-600 font-normal">
                    Calculated NLP Metrics & Extraction Rationale
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSentenceForModal(null)}
                className="text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              {/* Sentence Text Box */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-mono font-semibold text-xs text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                    Sentence {selectedSentenceForModal.id} &bull; Rank #{selectedSentenceForModal.rank}
                  </span>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    selectedSentenceForModal.selected ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {selectedSentenceForModal.selected ? '🟢 In Final Summary' : '🔴 Excluded'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
                  "{selectedSentenceForModal.text}"
                </p>
              </div>

              {/* Calculated Metrics Breakdown */}
              <div className="space-y-3 bg-slate-50 border border-slate-200 p-4 rounded-xl">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Calculated Metrics
                </h4>

                {/* Score */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Sentence Salience Score</span>
                    <span className="font-mono font-semibold text-blue-700">
                      {selectedSentenceForModal.score.toFixed(4)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, selectedSentenceForModal.score * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Frequency Score if present */}
                {selectedSentenceForModal.freq_score !== undefined && (
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                      <span>Term Frequency Weight</span>
                      <span className="font-mono font-semibold text-indigo-700">
                        {selectedSentenceForModal.freq_score.toFixed(4)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, selectedSentenceForModal.freq_score * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* TF-IDF Score if present */}
                {selectedSentenceForModal.tfidf_score !== undefined && (
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                      <span>TF-IDF Score</span>
                      <span className="font-mono font-semibold text-amber-700">
                        {selectedSentenceForModal.tfidf_score.toFixed(4)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, selectedSentenceForModal.tfidf_score * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Tokens Count */}
                <div className="pt-2 border-t border-slate-200 flex justify-between text-xs font-medium text-slate-700">
                  <span>Tokens / Words Count:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {selectedSentenceForModal.token_count || selectedSentenceForModal.text.trim().split(/\s+/).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-slate-200 bg-slate-50/70 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSentenceForModal(null)}
                className="px-5 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-medium rounded-xl border border-slate-300 shadow-2xs cursor-pointer active:scale-95 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
