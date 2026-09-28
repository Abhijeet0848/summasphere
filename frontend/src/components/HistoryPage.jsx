import React, { useEffect, useState } from 'react';
import { fetchHistory, deleteHistoryRecord, clearAllHistory, fetchHistoryRecord } from '../services/api';

export default function HistoryPage({ onSelectRecord, onBackToWorkspace }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethodFilter, setSelectedMethodFilter] = useState('all');

  const loadHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchHistory();
      setHistory(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load summarization history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete record #${id}?`)) return;
    try {
      await deleteHistoryRecord(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete record.');
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Delete ALL saved summaries? This cannot be undone.')) return;
    try {
      await clearAllHistory();
      setHistory([]);
    } catch (err) {
      alert(err.message || 'Failed to clear history.');
    }
  };

  const handleOpenRecord = async (item) => {
    try {
      const fullRecord = await fetchHistoryRecord(item.id);
      onSelectRecord(fullRecord);
      if (onBackToWorkspace) onBackToWorkspace();
    } catch (err) {
      onSelectRecord(item);
      if (onBackToWorkspace) onBackToWorkspace();
    }
  };

  const filteredHistory = history.filter((item) => {
    const matchesMethod = selectedMethodFilter === 'all' || item.method === selectedMethodFilter;
    const matchesSearch =
      item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.original_text && item.original_text.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesMethod && matchesSearch;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-6 shadow-xs my-3 sm:my-4 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>📜</span>
            <span>Saved Summaries</span>
          </h2>
          <p className="text-xs sm:text-sm font-normal text-slate-600 mt-0.5">
            Search, reopen, and manage your past summaries.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {onBackToWorkspace && (
            <button
              type="button"
              onClick={onBackToWorkspace}
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 px-3.5 py-1.5 rounded-xl transition-all duration-150 cursor-pointer shadow-2xs active:scale-95"
            >
              <span>←</span>
              <span>Back</span>
            </button>
          )}
          {history.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 px-3.5 py-1.5 rounded-xl transition-all duration-150 cursor-pointer shadow-2xs active:scale-95"
            >
              <span>🗑</span>
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 my-3 sm:my-4">
        <div className="relative flex-1 max-w-full sm:max-w-sm">
          <input
            type="text"
            placeholder="Search summaries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pl-8 focus:bg-white focus:border-blue-600 outline-none text-slate-800 font-normal placeholder:text-slate-400"
          />
          <span className="absolute left-2.5 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm text-slate-700 font-medium">Method:</span>
          <select
            value={selectedMethodFilter}
            onChange={(e) => setSelectedMethodFilter(e.target.value)}
            className="text-xs sm:text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 focus:border-blue-600 outline-none text-slate-800 font-medium cursor-pointer flex-1 sm:flex-initial"
          >
            <option value="all">All Methods</option>
            <option value="frequency">Word Frequency</option>
            <option value="tfidf">Key Words (TF-IDF)</option>
            <option value="hybrid">Combined (Hybrid)</option>
          </select>
        </div>
      </div>

      {/* Database Error Alert */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm text-red-800 font-medium flex justify-between items-center">
          <span>⚠️ {error}</span>
          <button onClick={loadHistory} className="text-red-800 font-bold underline cursor-pointer ml-2">
            Retry
          </button>
        </div>
      )}

      {/* History Items List */}
      <div className="divide-y divide-slate-200">
        {loading ? (
          <div className="py-12 sm:py-16 text-center text-slate-500 text-xs sm:text-sm font-normal flex flex-col items-center justify-center gap-2">
            <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <span>Loading saved records...</span>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-12 sm:py-16 text-center text-slate-500 text-xs sm:text-sm font-normal">
            <span className="text-3xl block mb-2">📭</span>
            {searchTerm || selectedMethodFilter !== 'all'
              ? 'No records match your search.'
              : 'No saved summaries yet. Summarize an article to create your first record.'}
          </div>
        ) : (
          filteredHistory.map((item) => (
            <div
              key={item.id}
              className="py-3.5 sm:py-4 hover:bg-slate-50 rounded-xl p-2.5 sm:p-3 transition-colors group cursor-pointer border border-transparent hover:border-slate-200"
              onClick={() => handleOpenRecord(item)}
            >
              <div className="flex flex-wrap justify-between items-center gap-2 mb-1.5">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="text-xs font-mono font-semibold text-slate-700">#{item.id}</span>
                  <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                    {item.method}
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-slate-800">
                    {item.num_selected_sentences} sentences
                  </span>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-xs text-slate-500 font-mono">
                    {item.created_at}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(item.id, e)}
                    className="text-red-500 hover:text-red-700 font-medium text-xs sm:text-sm p-1 rounded-md hover:bg-red-50 cursor-pointer transition-colors"
                    title="Delete record"
                  >
                    🗑
                  </button>
                </div>
              </div>

              {/* Summary Text Content */}
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal line-clamp-3 my-1">
                "{item.summary}"
              </p>

              {/* Telemetry Footer */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-slate-600 font-medium mt-2 pt-1.5 border-t border-slate-100">
                <span>Original: <strong>{item.original_word_count}</strong> words</span>
                <span>&bull;</span>
                <span>Summary: <strong>{item.summary_word_count}</strong> words</span>
                <span>&bull;</span>
                <span className="text-emerald-700 font-semibold">
                  -{Math.round((1 - item.compression_ratio) * 100)}% shorter
                </span>
                <span className="ml-auto text-blue-700 font-semibold group-hover:underline">
                  Open →
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
