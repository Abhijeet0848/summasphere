import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

export default function ComparisonSection({
  compareData,
  loading,
  onRunCompare,
  referenceSummary,
  setReferenceSummary
}) {
  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'visuals' | 'summaries'
  const [showRefInput, setShowRefInput] = useState(false);
  const [copiedMethod, setCopiedMethod] = useState(null);

  const handleCopy = (summary, method) => {
    navigator.clipboard.writeText(summary);
    setCopiedMethod(method);
    setTimeout(() => setCopiedMethod(null), 2000);
  };

  if (!compareData && !loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs my-3 sm:my-5 max-w-3xl mx-auto text-center">
        <div className="w-12 h-12 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-2xl flex items-center justify-center text-xl mx-auto mb-3">
          ⚖️
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5">
          Compare All 3 Summarization Methods
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 font-normal mb-4 sm:mb-5 leading-relaxed max-w-lg mx-auto">
          See summaries created by Word Frequency, Key Words (TF-IDF), and Combined (Hybrid) side-by-side.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => setShowRefInput(!showRefInput)}
            className="w-full sm:w-auto text-xs sm:text-sm font-medium text-slate-700 hover:text-blue-900 bg-white hover:bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-300 hover:border-blue-400 shadow-2xs active:scale-95 transition-all duration-150 cursor-pointer"
          >
            {showRefInput ? 'Hide Reference Text' : '+ Add Reference for Accuracy'}
          </button>
          <button
            type="button"
            onClick={onRunCompare}
            className="w-full sm:w-auto text-xs sm:text-sm font-semibold text-white btn-3d-primary px-6 py-2.5 rounded-xl cursor-pointer"
          >
            ⚡ Compare Methods
          </button>
        </div>

        {showRefInput && (
          <div className="mt-4 pt-4 border-t border-slate-200 text-left animate-in fade-in duration-150">
            <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1">
              Reference / Human Summary (Optional):
            </label>
            <textarea
              value={referenceSummary}
              onChange={(e) => setReferenceSummary(e.target.value)}
              placeholder="Paste a human-written summary here to measure accuracy scores..."
              className="w-full h-24 p-3 text-xs sm:text-sm font-normal bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-600 focus:bg-white resize-none text-slate-800 placeholder:text-slate-400"
            />
          </div>
        )}
      </div>
    );
  }

  const results = compareData?.results || [];
  const hasRef = compareData?.has_reference;

  // Prepare chart dataset
  const chartData = results.map((r) => {
    const item = {
      name: r.method_name.replace(" (Weighted Blend)", "").replace("Based", "").trim(),
      methodKey: r.method,
      words: r.summary_word_count,
      timeMs: r.processing_time_ms,
      compressionPct: Math.round((1 - r.compression_ratio) * 100),
      avgScore: Number(r.average_sentence_score.toFixed(4)),
    };
    if (r.rouge) {
      item.rouge1 = Number((r.rouge.rouge_1.f1 * 100).toFixed(1));
      item.rouge2 = Number((r.rouge.rouge_2.f1 * 100).toFixed(1));
      item.rougeL = Number((r.rouge.rouge_l.f1 * 100).toFixed(1));
    }
    return item;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 shadow-xs my-3 sm:my-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-2">
            <span>⚖️</span>
            <span>Side-by-Side Method Comparison</span>
          </h3>
          <p className="text-xs sm:text-sm font-normal text-slate-600">
            Comparing how each method summarized your text.
          </p>
        </div>

        {/* View Switcher Tabs (Responsive flex wrap on mobile) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-200/80 p-1 rounded-lg border border-slate-300 text-xs sm:text-sm w-full sm:w-auto justify-between gap-1">
            <button
              onClick={() => setActiveTab('table')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md font-medium cursor-pointer transition-all text-center ${
                activeTab === 'table' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📊 Results
            </button>
            <button
              onClick={() => setActiveTab('visuals')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md font-medium cursor-pointer transition-all text-center ${
                activeTab === 'visuals' ? 'bg-white text-indigo-800 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📈 Chart
            </button>
            <button
              onClick={() => setActiveTab('summaries')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md font-medium cursor-pointer transition-all text-center ${
                activeTab === 'summaries' ? 'bg-white text-blue-800 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📑 Summaries
            </button>
          </div>

          <button
            onClick={onRunCompare}
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl shadow-xs active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-50"
          >
            <span>↻</span>
            <span>{loading ? 'Comparing...' : 'Compare Again'}</span>
          </button>
        </div>
      </div>

      {/* Content Body */}
      <div className="mt-3 sm:mt-4">
        {/* 1. Comparison Metrics Table */}
        {activeTab === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[550px]">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3 text-right">Time</th>
                  <th className="py-2.5 px-3 text-right">Words</th>
                  <th className="py-2.5 px-3 text-right">Shortened By</th>
                  <th className="py-2.5 px-3 text-right">Avg Score</th>
                  {hasRef && (
                    <>
                      <th className="py-2.5 px-3 text-right text-blue-800">Word Match</th>
                      <th className="py-2.5 px-3 text-right text-indigo-800">Phrase Match</th>
                      <th className="py-2.5 px-3 text-right text-emerald-800">Structure Match</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {results.map((item) => (
                  <tr key={item.method} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0"></span>
                      <span>{item.method_name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-600">
                      {item.processing_time_ms} ms
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-600">
                      {item.summary_word_count}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-emerald-700">
                      {Math.round((1 - item.compression_ratio) * 100)}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                      {item.average_sentence_score.toFixed(4)}
                    </td>
                    {hasRef && (
                      <>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-blue-700">
                          {item.rouge ? `${(item.rouge.rouge_1.f1 * 100).toFixed(1)}%` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-indigo-700">
                          {item.rouge ? `${(item.rouge.rouge_2.f1 * 100).toFixed(1)}%` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700">
                          {item.rouge ? `${(item.rouge.rouge_l.f1 * 100).toFixed(1)}%` : '-'}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. Visual Comparison Chart */}
        {activeTab === 'visuals' && (
          <div className="space-y-4">
            <div className="h-60 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} stroke="#cbd5e1" />
                  <YAxis tick={{ fontSize: 11, fill: '#475569' }} stroke="#cbd5e1" />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#475569', paddingTop: '8px' }} />
                  <Bar dataKey="words" name="Summary Words" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="compressionPct" name="Reduction %" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="timeMs" name="Time (ms)" fill="#d97706" radius={[4, 4, 0, 0]} />
                  {hasRef && (
                    <>
                      <Bar dataKey="rouge1" name="Word Match %" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="rougeL" name="Structure Match %" fill="#db2777" radius={[4, 4, 0, 0]} />
                    </>
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 3. Extracted Summaries Grid */}
        {activeTab === 'summaries' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {results.map((item) => (
              <div key={item.method} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs sm:text-sm font-semibold text-slate-900">{item.method_name}</span>
                    <button
                      onClick={() => handleCopy(item.summary, item.method)}
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-all duration-150 cursor-pointer shadow-2xs active:scale-95 ${
                        copiedMethod === item.method
                          ? 'bg-emerald-600 text-white border border-emerald-600'
                          : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
                      }`}
                    >
                      <span>{copiedMethod === item.method ? '✓' : '📋'}</span>
                      <span>{copiedMethod === item.method ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
                    {item.summary}
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-200 text-xs text-slate-600 flex justify-between font-mono font-medium">
                  <span>{item.summary_word_count} words</span>
                  <span>{item.processing_time_ms} ms</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
