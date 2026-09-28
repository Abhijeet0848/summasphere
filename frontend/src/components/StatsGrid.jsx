import React from 'react';

export default function StatsGrid({ stats }) {
  if (!stats) return null;

  const statData = stats.statistics || stats;
  const originalWords = statData.original_word_count ?? 0;
  const summaryWords = statData.summary_word_count ?? 0;
  const originalSentences = statData.original_sentence_count ?? 0;
  const summarySentences = statData.summary_sentence_count ?? 0;
  const compressionRatio = statData.compression_ratio ?? 0;
  const processingTimeMs = statData.processing_time_ms ?? 0;

  const reductionPercent = Math.round((1 - compressionRatio) * 100);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs my-3 sm:my-4">
      <h3 className="text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider mb-3">
        Summary Numbers & Results
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {/* Original Words */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
          <div className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Original Words</div>
          <div className="text-lg sm:text-2xl font-bold text-slate-900 font-mono">{originalWords}</div>
        </div>

        {/* Summary Words */}
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-center">
          <div className="text-xs sm:text-sm font-medium text-blue-900 mb-1">Summary Words</div>
          <div className="text-lg sm:text-2xl font-bold text-blue-700 font-mono">{summaryWords}</div>
        </div>

        {/* Original Sentences */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
          <div className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Original Sentences</div>
          <div className="text-lg sm:text-2xl font-bold text-slate-900 font-mono">{originalSentences}</div>
        </div>

        {/* Summary Sentences */}
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-center">
          <div className="text-xs sm:text-sm font-medium text-blue-900 mb-1">Summary Sentences</div>
          <div className="text-lg sm:text-2xl font-bold text-blue-700 font-mono">{summarySentences}</div>
        </div>

        {/* Shortened By */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-center">
          <div className="text-xs sm:text-sm font-medium text-emerald-900 mb-1">Shortened By</div>
          <div className="text-lg sm:text-2xl font-bold text-emerald-700 font-mono">
            {reductionPercent}%
            <span className="text-xs font-normal text-emerald-800 ml-1 block sm:inline">smaller</span>
          </div>
        </div>

        {/* Time Taken */}
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 text-center">
          <div className="text-xs sm:text-sm font-medium text-indigo-900 mb-1">Time Taken</div>
          <div className="text-lg sm:text-2xl font-bold text-indigo-700 font-mono">
            {processingTimeMs} <span className="text-xs font-normal text-indigo-900">ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}
