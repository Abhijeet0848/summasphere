import React from 'react';
import {
  Sparkles,
  Layers,
  ListOrdered,
  Scale,
  History
} from 'lucide-react';

export default function BottomNavBar({
  currentView,
  setView,
  hasSummary
}) {
  const navItems = [
    {
      id: 'workspace',
      label: 'Home',
      icon: Sparkles,
      tooltip: 'Summarizer Studio'
    },
    {
      id: 'nlp_analysis',
      label: 'NLP',
      icon: Layers,
      requiresSummary: true,
      tooltip: 'NLP Tokenization & Lemmatization'
    },
    {
      id: 'ranking',
      label: 'Scores',
      icon: ListOrdered,
      requiresSummary: true,
      tooltip: 'Sentence Scoring & Ranking'
    },
    {
      id: 'compare',
      label: 'Compare',
      icon: Scale,
      tooltip: 'Multi-Algorithm Comparison'
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
      tooltip: 'Saved Summaries'
    }
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm sm:max-w-md transition-all duration-300"
      style={{ bottom: 'max(1.25rem, calc(env(safe-area-inset-bottom, 0px) + 0.9rem))' }}
      aria-label="Bottom Navigation Bar"
    >
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-full px-3 py-2 shadow-[0_12px_36px_rgba(15,23,42,0.18),0_4px_12px_rgba(0,0,0,0.08)] ring-1 ring-black/5 flex items-center justify-between">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              title={item.tooltip}
              className={`group relative flex flex-col items-center justify-center flex-1 py-0.5 transition-all duration-200 cursor-pointer select-none active:scale-95 ${
                isActive
                  ? 'text-indigo-600'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              {/* Icon Container */}
              <div
                className={`relative flex items-center justify-center w-9 h-9 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105'
                    : 'text-slate-700 group-hover:text-slate-950 group-hover:bg-slate-100/80'
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2.2]" />

                {/* Ready indicator dot if summary is available */}
                {item.requiresSummary && hasSummary && !isActive && (
                  <span
                    className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse"
                    title="Data ready"
                  />
                )}
              </div>

              {/* Readable Label */}
              <span
                className={`text-[11px] font-semibold tracking-tight mt-1 transition-colors ${
                  isActive
                    ? 'text-indigo-600 font-bold'
                    : 'text-slate-700 group-hover:text-slate-950'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
