import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  CartesianGrid
} from 'recharts';

export default function ScoreChart({ sentences, wordFrequencies, stats, originalText }) {
  if (!sentences || sentences.length === 0) return null;

  // 1. Sentence scores dataset
  const sentenceData = sentences.map((s) => ({
    name: `S${s.id}`,
    fullName: `Sentence ${s.id}`,
    score: s.score,
    rank: s.rank,
    selected: s.selected,
    textPreview: s.text.length > 60 ? s.text.substring(0, 60) + '...' : s.text
  }));

  const avgScore = sentenceData.reduce((acc, curr) => acc + curr.score, 0) / sentenceData.length;

  // 2. Word Frequency dataset (top 10 keywords)
  const freqData = wordFrequencies
    ? Object.entries(wordFrequencies)
        .slice(0, 10)
        .map(([word, count]) => ({
          word,
          count,
        }))
    : [];

  const charCount = originalText ? originalText.length : 0;
  const wordCount = stats?.original_word_count || 0;
  const sentenceCount = stats?.original_sentence_count || sentences.length;
  const avgWords = sentenceCount > 0 ? (wordCount / sentenceCount).toFixed(1) : 0;

  const CustomSentenceTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs max-w-xs border border-slate-800">
          <div className="flex justify-between items-center mb-1 font-semibold">
            <span className="text-blue-400 font-semibold">{item.fullName}</span>
            <span className={item.selected ? 'text-emerald-400 font-semibold' : 'text-slate-400 font-normal'}>
              {item.selected ? '🟢 In Summary' : `Rank #${item.rank}`}
            </span>
          </div>
          <div className="text-slate-300 mb-1 font-mono text-[11px]">
            Composite Score: <strong>{item.score.toFixed(4)}</strong>
          </div>
          <div className="text-slate-400 italic text-[11px] line-clamp-2">
            "{item.textPreview}"
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Telemetry Numbers Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-xs">
          <div className="text-xs font-medium text-slate-600 mb-0.5">Total Words</div>
          <div className="text-lg font-bold text-slate-900 font-mono">{wordCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-xs">
          <div className="text-xs font-medium text-slate-600 mb-0.5">Sentences</div>
          <div className="text-lg font-bold text-slate-900 font-mono">{sentenceCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-xs">
          <div className="text-xs font-medium text-slate-600 mb-0.5">Characters</div>
          <div className="text-lg font-bold text-slate-900 font-mono">{charCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-xs">
          <div className="text-xs font-medium text-slate-600 mb-0.5">Avg Sentence</div>
          <div className="text-lg font-bold text-slate-900 font-mono">{avgWords} <span className="text-xs font-normal text-slate-500">w</span></div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-xs">
          <div className="text-xs font-medium text-slate-600 mb-0.5">Unique Words</div>
          <div className="text-lg font-bold text-indigo-700 font-mono">{freqData.length > 0 ? Object.keys(wordFrequencies).length : '-'}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-xs">
          <div className="text-xs font-medium text-slate-600 mb-0.5">Summary Words</div>
          <div className="text-lg font-bold text-blue-700 font-mono">{stats?.summary_word_count || 0}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-xs col-span-2 sm:col-span-1">
          <div className="text-xs font-medium text-emerald-900 mb-0.5">Shortened By</div>
          <div className="text-lg font-bold text-emerald-700 font-mono">
            {stats?.compression_ratio ? Math.round((1 - stats.compression_ratio) * 100) : 0}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Sentence Importance Score Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-2">
                <span>📊</span>
                <span>Sentence Importance Scores</span>
              </h3>
              <p className="text-xs text-slate-600 font-normal">
                Green bars indicate extracted summary sentences.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600"></span>
                <span className="text-slate-800 font-medium">In Summary</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-slate-300"></span>
                <span className="text-slate-500 font-normal">Excluded</span>
              </div>
            </div>
          </div>

          <div className="h-60 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sentenceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} stroke="#cbd5e1" />
                <YAxis tick={{ fontSize: 11, fill: '#475569' }} stroke="#cbd5e1" />
                <Tooltip content={<CustomSentenceTooltip />} />
                <ReferenceLine y={avgScore} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: 'Avg', fill: '#64748b', fontSize: 10, position: 'right' }} />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {sentenceData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.selected ? '#059669' : '#cbd5e1'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Top Word Frequency Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-2">
                <span>🔤</span>
                <span>Top Salient Word Frequencies</span>
              </h3>
              <p className="text-xs text-slate-600 font-normal">
                Most frequent content keywords (lemmatized, stop-words excluded).
              </p>
            </div>
            <span className="text-xs font-medium text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
              Top Keywords
            </span>
          </div>

          <div className="h-60 sm:h-72 w-full">
            {freqData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={freqData} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#475569' }} stroke="#cbd5e1" />
                  <YAxis type="category" dataKey="word" tick={{ fontSize: 11, fill: '#475569' }} stroke="#cbd5e1" />
                  <Tooltip />
                  <Bar dataKey="count" name="Occurrences" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                    {freqData.map((_, index) => (
                      <Cell key={`cell-freq-${index}`} fill={index === 0 ? '#2563eb' : index < 3 ? '#4f46e5' : '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs font-normal">
                No frequency data available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

