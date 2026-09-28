import React, { useState } from 'react';

export default function OutputSection({
  summary,
  method,
  compressionRatio,
  loading
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!summary) return;
    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `summary_${method}_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const compressionPercent = compressionRatio
    ? Math.round((1 - compressionRatio) * 100)
    : 0;

  const summaryWordCount = summary ? summary.trim().split(/\s+/).length : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col justify-between h-full">
      <div>
        {/* Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">📄</span>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 leading-tight">
                Summary
              </h2>
              {summary && (
                <p className="text-[11px] text-slate-500 font-medium">
                  {summaryWordCount} words &bull; {compressionPercent}% shorter
                </p>
              )}
            </div>
          </div>

          {summary && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopy}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer shadow-2xs active:scale-95 ${
                  copied
                    ? 'bg-emerald-600 text-white border border-emerald-600'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300'
                }`}
              >
                <span>{copied ? '✓' : '📋'}</span>
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 transition-all duration-150 cursor-pointer shadow-2xs active:scale-95"
              >
                <span>📥</span>
                <span>Download</span>
              </button>
            </div>
          )}
        </div>

        {/* Output Content Area */}
        <div className="min-h-[220px] sm:min-h-[260px] p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-44 text-slate-600 space-y-2 text-center p-4">
              <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <p className="text-xs font-medium text-slate-700">Generating summary...</p>
            </div>
          ) : summary ? (
            <p className="whitespace-pre-wrap text-slate-900 font-normal leading-relaxed text-xs sm:text-sm">
              {summary}
            </p>
          ) : (
            <div className="flex flex-col items-center justify-center h-44 text-slate-500 text-center p-4">
              <span className="text-2xl mb-1.5 opacity-60">📑</span>
              <p className="text-xs font-medium text-slate-600">Your summary will appear here once you click Summarize.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


