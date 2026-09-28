import React, { useState } from 'react';

export default function PipelineInspector({ summaryData, originalText }) {
  const [viewMode, setViewMode] = useState('full'); // 'full' | 'tabbed'
  const [activeStep, setActiveStep] = useState(1);

  if (!summaryData) return null;

  const sentences = summaryData.sentences || [];
  const wordFreqs = summaryData.word_frequencies || {};
  const sortedWordFreqs = Object.entries(wordFreqs).sort((a, b) => b[1] - a[1]);

  const steps = [
    { id: 1, title: '1. Original Text', icon: '📝' },
    { id: 2, title: '2. Sentences', icon: '✂️' },
    { id: 3, title: '3. Words', icon: '🔤' },
    { id: 4, title: '4. Clean Words', icon: '🧹' },
    { id: 5, title: '5. Root Words', icon: '🌱' },
    { id: 6, title: '6. Word Counts', icon: '📊' },
    { id: 7, title: '7. Scores', icon: '🎯' },
    { id: 8, title: '8. Summary', icon: '✨' },
  ];

  const renderStep1 = () => (
    <div className="space-y-2">
      <div className="flex flex-wrap justify-between items-center text-xs sm:text-sm font-semibold text-slate-900 pb-1.5 border-b border-slate-200 gap-1">
        <span className="flex items-center gap-1.5">
          <span className="text-blue-600 font-bold">1.</span> Original Text
        </span>
        <span className="text-slate-600 font-normal text-xs sm:text-sm">
          {summaryData.original_word_count || 0} words &bull; {sentences.length} sentences
        </span>
      </div>
      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-mono p-3.5 bg-white rounded-xl border border-slate-200 whitespace-pre-wrap font-normal">
        {summaryData.original_text || originalText || 'No text available.'}
      </p>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-2.5">
      <div className="flex flex-wrap justify-between items-center text-xs sm:text-sm font-semibold text-slate-900 pb-1.5 border-b border-slate-200 gap-1">
        <span className="flex items-center gap-1.5">
          <span className="text-blue-600 font-bold">2.</span> Split into Sentences
        </span>
        <span className="text-slate-600 font-normal text-xs sm:text-sm">{sentences.length} sentences found</span>
      </div>
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {sentences.map((s) => (
          <div key={s.id} className="p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm flex gap-3 items-start">
            <span className="font-mono font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-xs shrink-0">
              S{s.id}
            </span>
            <span className="text-slate-800 leading-relaxed font-normal">{s.text}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-2.5">
      <div className="flex flex-wrap justify-between items-center text-xs sm:text-sm font-semibold text-slate-900 pb-1.5 border-b border-slate-200 gap-1">
        <span className="flex items-center gap-1.5">
          <span className="text-blue-600 font-bold">3.</span> Split into Lowercase Words
        </span>
        <span className="text-slate-600 font-normal text-xs sm:text-sm">Every sentence broken into words</span>
      </div>
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {sentences.map((s) => {
          const toks = s.raw_tokens && s.raw_tokens.length > 0 ? s.raw_tokens : s.text.toLowerCase().match(/\b[a-z0-9'-]+\b/g) || [];
          return (
            <div key={s.id} className="p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm">
              <div className="font-mono font-semibold text-blue-800 mb-1">Sentence {s.id}:</div>
              <div className="font-mono text-slate-800 text-xs sm:text-sm bg-slate-50 p-2.5 rounded-lg border border-slate-200 break-words font-normal">
                [{toks.join(', ')}]
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-2.5">
      <div className="flex flex-wrap justify-between items-center text-xs sm:text-sm font-semibold text-slate-900 pb-1.5 border-b border-slate-200 gap-1">
        <span className="flex items-center gap-1.5">
          <span className="text-blue-600 font-bold">4.</span> Remove Common Words
        </span>
        <span className="text-slate-600 font-normal text-xs sm:text-sm">Removes words like 'the', 'is', 'at'</span>
      </div>
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {sentences.map((s) => {
          const toks = s.filtered_tokens && s.filtered_tokens.length > 0 ? s.filtered_tokens : s.lemmas || [];
          return (
            <div key={s.id} className="p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm">
              <div className="font-mono font-semibold text-indigo-800 mb-1">Sentence {s.id}:</div>
              <div className="font-mono text-indigo-800 text-xs sm:text-sm bg-indigo-50 p-2.5 rounded-lg border border-indigo-200 font-normal break-words">
                [{toks.join(', ')}]
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-2.5">
      <div className="flex flex-wrap justify-between items-center text-xs sm:text-sm font-semibold text-slate-900 pb-1.5 border-b border-slate-200 gap-1">
        <span className="flex items-center gap-1.5">
          <span className="text-blue-600 font-bold">5.</span> Convert to Base Words (Lemmas)
        </span>
        <span className="text-slate-600 font-normal text-xs sm:text-sm">Dictionary root words</span>
      </div>
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {sentences.map((s) => {
          const lems = s.lemmas && s.lemmas.length > 0 ? s.lemmas : [];
          return (
            <div key={s.id} className="p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm">
              <div className="font-mono font-semibold text-emerald-800 mb-1">Sentence {s.id}:</div>
              <div className="font-mono text-emerald-800 text-xs sm:text-sm bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 font-normal break-words">
                [{lems.join(', ')}]
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-2.5">
      <div className="flex flex-wrap justify-between items-center text-xs sm:text-sm font-semibold text-slate-900 pb-1.5 border-b border-slate-200 gap-1">
        <span className="flex items-center gap-1.5">
          <span className="text-blue-600 font-bold">6.</span> Count Most Important Words
        </span>
        <span className="text-slate-600 font-normal text-xs sm:text-sm">Top frequent words</span>
      </div>
      <div className="overflow-x-auto max-h-72 border border-slate-200 rounded-xl">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold sticky top-0">
            <tr>
              <th className="py-2.5 px-3">Word</th>
              <th className="py-2.5 px-3 text-right">Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {sortedWordFreqs.slice(0, 15).map(([word, count]) => (
              <tr key={word} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-mono font-normal text-slate-800">{word}</td>
                <td className="py-2.5 px-3 text-right font-mono text-blue-700 font-semibold">{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderStep7 = () => (
    <div className="space-y-2.5">
      <div className="flex flex-wrap justify-between items-center text-xs sm:text-sm font-semibold text-slate-900 pb-1.5 border-b border-slate-200 gap-1">
        <span className="flex items-center gap-1.5">
          <span className="text-blue-600 font-bold">7.</span> Score Each Sentence
        </span>
        <span className="text-slate-600 font-normal text-xs sm:text-sm">Importance score</span>
      </div>
      <div className="overflow-x-auto max-h-72 border border-slate-200 rounded-xl">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold sticky top-0">
            <tr>
              <th className="py-2.5 px-3 w-24 text-center">Sentence</th>
              <th className="py-2.5 px-3 w-20 text-right">Score</th>
              <th className="py-2.5 px-3 w-24 text-center">In Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {sentences.map((s) => (
              <tr key={s.id} className={`hover:bg-slate-50 ${s.selected ? 'bg-emerald-50/50' : ''}`}>
                <td className="py-2.5 px-3 font-mono font-semibold text-center text-blue-800">S{s.id}</td>
                <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">{s.score.toFixed(4)}</td>
                <td className="py-2.5 px-3 text-center">
                  {s.selected ? (
                    <span className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      ✓ Yes
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 font-normal">No</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderStep8 = () => (
    <div className="space-y-2">
      <div className="flex flex-wrap justify-between items-center text-xs sm:text-sm font-semibold text-slate-900 pb-1.5 border-b border-slate-200 gap-1">
        <span className="flex items-center gap-1.5">
          <span className="text-blue-600 font-bold">8.</span> Final Summary
        </span>
        <span className="text-emerald-800 font-semibold text-xs sm:text-sm">
          {summaryData.summary_sentence_count} sentences &bull; {summaryData.summary_word_count} words
        </span>
      </div>
      <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs sm:text-sm leading-relaxed text-slate-800 font-normal whitespace-pre-wrap">
        {summaryData.summary || 'No summary available.'}
      </div>
    </div>
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs my-3 sm:my-5">
      {/* Top Header & Layout Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-2">
            <span>🔬</span>
            <span>How the Summary is Made</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
              8 Steps
            </span>
          </h3>
          <p className="text-xs font-normal text-slate-600">
            See how your text was split, cleaned, scored, and summarized.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex bg-slate-200/80 p-1 rounded-lg border border-slate-300 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('full')}
            className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-all ${
              viewMode === 'full' ? 'bg-white text-blue-800 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📜 All Steps
          </button>
          <button
            type="button"
            onClick={() => setViewMode('tabbed')}
            className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-all ${
              viewMode === 'tabbed' ? 'bg-white text-blue-800 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📑 Step by Step
          </button>
        </div>
      </div>

      {/* FULL VIEW: All 8 Steps stacked in order */}
      {viewMode === 'full' ? (
        <div className="mt-4 space-y-4 sm:space-y-6">
          <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl">{renderStep1()}</div>
          <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl">{renderStep2()}</div>
          <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl">{renderStep3()}</div>
          <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl">{renderStep4()}</div>
          <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl">{renderStep5()}</div>
          <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl">{renderStep6()}</div>
          <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl">{renderStep7()}</div>
          <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl">{renderStep8()}</div>
        </div>
      ) : (
        /* TABBED VIEW: Interactive step navigator */
        <div className="mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5 mb-3 sm:mb-4 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            {steps.map((step) => (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(step.id)}
                className={`px-2 py-2 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition-all cursor-pointer text-center ${
                  activeStep === step.id
                    ? 'bg-white text-blue-800 shadow-xs border border-blue-200 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <span className="text-sm">{step.icon}</span>
                <span className="truncate w-full text-xs">{step.title}</span>
              </button>
            ))}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 min-h-56">
            {activeStep === 1 && renderStep1()}
            {activeStep === 2 && renderStep2()}
            {activeStep === 3 && renderStep3()}
            {activeStep === 4 && renderStep4()}
            {activeStep === 5 && renderStep5()}
            {activeStep === 6 && renderStep6()}
            {activeStep === 7 && renderStep7()}
            {activeStep === 8 && renderStep8()}
          </div>
        </div>
      )}
    </div>
  );
}
