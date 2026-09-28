import React, { useState } from 'react';
import { evaluateRouge } from '../services/api';

export default function RougeModal({ isOpen, onClose, candidateSummary }) {
  const [reference, setReference] = useState('');
  const [candidate, setCandidate] = useState(candidateSummary || '');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (candidateSummary) {
      setCandidate(candidateSummary);
    }
  }, [candidateSummary]);

  const handleEvaluate = async () => {
    if (!candidate.trim() || !reference.trim()) {
      setError('Please provide both your summary and the reference summary.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await evaluateRouge({ candidate, reference });
      setResults(data);
    } catch (err) {
      setError(err.message || 'Check failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-2">
              <span>🎯</span>
              <span>Summary Accuracy Check (ROUGE)</span>
            </h3>
            <p className="text-xs sm:text-sm font-normal text-slate-600">
              Check how closely your summary matches a reference text.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 text-sm font-semibold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-3.5 sm:p-5 overflow-y-auto flex-1 space-y-3.5 sm:space-y-4">
          {error && (
            <div className="p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs sm:text-sm font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1">
                Generated Summary:
              </label>
              <textarea
                value={candidate}
                onChange={(e) => setCandidate(e.target.value)}
                placeholder="Generated summary..."
                className="w-full h-28 sm:h-36 p-3 text-xs sm:text-sm font-normal bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-600 focus:bg-white resize-none text-slate-800 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1">
                Reference Summary:
              </label>
              <textarea
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Paste reference text here..."
                className="w-full h-28 sm:h-36 p-3 text-xs sm:text-sm font-normal bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-600 focus:bg-white resize-none text-slate-800 placeholder:text-slate-400"
              />
            </div>
          </div>

          <button
            onClick={handleEvaluate}
            disabled={loading || !candidate.trim() || !reference.trim()}
            className={`w-full py-3.5 px-5 rounded-2xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 select-none cursor-pointer tracking-wide ${
              !candidate.trim() || !reference.trim() || loading
                ? 'btn-3d-disabled'
                : 'btn-3d-primary text-white'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <span>Checking Match...</span>
              </>
            ) : (
              <>
                <span>🎯</span>
                <span>Calculate Match Score</span>
              </>
            )}
          </button>

          {/* Results Display */}
          {results && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider">
                  Academic Accuracy Evaluation (ROUGE Metrics):
                </h4>
                <span className="text-[11px] font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                  Extractive Ground Truth Comparison
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {/* ROUGE-1 */}
                <div className="bg-white border border-blue-200 rounded-xl p-3.5 text-center shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-semibold text-blue-900 mb-0.5">ROUGE-1 (Unigram Overlap)</div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono my-1">
                      {(results.rouge_1.f1 * 100).toFixed(1)}%
                    </div>
                    <p className="text-[11px] text-slate-600 font-normal mb-2">
                      Measures vocabulary & content coverage overlap.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 font-mono font-medium flex justify-between">
                    <span>P: {(results.rouge_1.precision * 100).toFixed(0)}%</span>
                    <span>R: {(results.rouge_1.recall * 100).toFixed(0)}%</span>
                    <span className="font-semibold text-blue-700">F1: {results.rouge_1.f1.toFixed(3)}</span>
                  </div>
                </div>

                {/* ROUGE-2 */}
                <div className="bg-white border border-indigo-200 rounded-xl p-3.5 text-center shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-semibold text-indigo-900 mb-0.5">ROUGE-2 (Bigram Overlap)</div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono my-1">
                      {(results.rouge_2.f1 * 100).toFixed(1)}%
                    </div>
                    <p className="text-[11px] text-slate-600 font-normal mb-2">
                      Measures 2-word phrase fluency and context preservation.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 font-mono font-medium flex justify-between">
                    <span>P: {(results.rouge_2.precision * 100).toFixed(0)}%</span>
                    <span>R: {(results.rouge_2.recall * 100).toFixed(0)}%</span>
                    <span className="font-semibold text-indigo-700">F1: {results.rouge_2.f1.toFixed(3)}</span>
                  </div>
                </div>

                {/* ROUGE-L */}
                <div className="bg-white border border-emerald-200 rounded-xl p-3.5 text-center shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-semibold text-emerald-900 mb-0.5">ROUGE-L (Longest Subsequence)</div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono my-1">
                      {(results.rouge_l.f1 * 100).toFixed(1)}%
                    </div>
                    <p className="text-[11px] text-slate-600 font-normal mb-2">
                      Measures structural word order without requiring consecutive match.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 font-mono font-medium flex justify-between">
                    <span>P: {(results.rouge_l.precision * 100).toFixed(0)}%</span>
                    <span>R: {(results.rouge_l.recall * 100).toFixed(0)}%</span>
                    <span className="font-semibold text-emerald-700">F1: {results.rouge_l.f1.toFixed(3)}</span>
                  </div>
                </div>
              </div>

              {/* Metric Reference Guide */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
                <div className="font-semibold text-slate-800">Academic Metric Definitions:</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div><strong>Precision (P):</strong> Fraction of words in generated summary that appear in reference.</div>
                  <div><strong>Recall (R):</strong> Fraction of reference words captured in generated summary.</div>
                  <div><strong>F1-Score:</strong> Harmonic mean balancing Precision and Recall.</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-medium rounded-xl cursor-pointer border border-slate-300 shadow-2xs active:scale-95 transition-all duration-150"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
