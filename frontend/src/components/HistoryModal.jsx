import React, { useEffect, useState } from 'react';
import { fetchHistory, deleteHistoryRecord, clearAllHistory } from '../services/api';

export default function HistoryModal({ isOpen, onClose, onSelectRecord }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await fetchHistory();
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteHistoryRecord(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert('Failed to delete history item');
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Clear all summarization history?')) return;
    try {
      await clearAllHistory();
      setHistory([]);
    } catch (err) {
      alert('Failed to clear history');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-up">
      <div className="bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-white/15 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/[0.04]">
          <div>
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <span>📜</span>
              <span>Saved Summaries</span>
            </h3>
            <p className="text-xs sm:text-sm font-medium text-slate-300">
              Past summaries saved in your local database.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={handleClear}
                className="text-xs sm:text-sm text-rose-300 hover:text-rose-200 font-bold px-3 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 cursor-pointer active:scale-95"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 text-sm font-black cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 divide-y divide-white/10">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs sm:text-sm font-medium">Loading saved records...</div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs sm:text-sm font-medium">No saved summaries found.</div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (onSelectRecord) onSelectRecord(item);
                  onClose();
                }}
                className="py-3.5 px-3 hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer group"
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      {item.method}
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-white">
                      {item.summary_sentence_count} / {item.original_sentence_count} sentences
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono font-medium">
                      {item.created_at}
                    </span>
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className="text-rose-400 hover:text-rose-300 text-xs sm:text-sm p-1 cursor-pointer font-bold"
                    >
                      🗑
                    </button>
                  </div>
                </div>

                <div className="text-xs sm:text-sm text-slate-200 line-clamp-2 font-normal mt-1 leading-relaxed">
                  "{item.summary}"
                </div>

                <div className="flex gap-4 text-xs text-slate-400 font-medium mt-1.5">
                  <span>Reduction: <strong className="text-emerald-400 font-bold">{Math.round((1 - item.compression_ratio) * 100)}%</strong></span>
                  <span>Time: <strong className="text-slate-200">{item.processing_time_ms} ms</strong></span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-white/10 bg-white/[0.04] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-extrabold rounded-xl cursor-pointer border border-white/15 transition-colors active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

