import React from 'react';
import {
  Sparkles,
  BarChart3,
  ListOrdered,
  Layers,
  Scale,
  History,
  Target
} from 'lucide-react';

export default function Header({ currentView, setView, onOpenRouge, hasSummary }) {
  const navItems = [
    { id: 'workspace', label: 'Summarize', shortLabel: 'Summarize', icon: Sparkles },
    { id: 'nlp_analysis', label: 'NLP Analysis', shortLabel: 'NLP', icon: Layers, requiresSummary: true },
    { id: 'ranking', label: 'Sentence Scores', shortLabel: 'Scores', icon: ListOrdered, requiresSummary: true },
    { id: 'analytics', label: 'Stats & Charts', shortLabel: 'Stats', icon: BarChart3, requiresSummary: true },
    { id: 'compare', label: 'Compare Methods', shortLabel: 'Compare', icon: Scale },
    { id: 'history', label: 'History', shortLabel: 'History', icon: History },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-2 sm:gap-3">
          
          {/* Brand Left */}
          <div
            className="flex items-center gap-2 cursor-pointer select-none shrink-0 group"
            onClick={() => setView('workspace')}
          >
            <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl overflow-hidden bg-white border border-slate-300 shadow-sm flex items-center justify-center p-0.5 transition-transform group-hover:scale-105">
              <img
                src="/logo.png"
                alt="SummaSphere"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <h1 className="flex items-center m-0 p-0 text-base sm:text-lg font-bold tracking-tight text-slate-900">
              <span className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 bg-clip-text text-transparent">
                SummaSphere
              </span>
            </h1>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-0.5 xl:gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs xl:text-sm rounded-lg font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-white'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-500'
                    }`}
                  />
                  <span className="hidden xl:inline">{item.label}</span>
                  <span className="inline xl:hidden">{item.shortLabel}</span>
                  {item.requiresSummary && hasSummary && (
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isActive ? 'bg-emerald-300 ring-2 ring-blue-600' : 'bg-emerald-600'
                      }`}
                      title="Summary ready"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={onOpenRouge}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold text-slate-800 hover:text-blue-900 bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-xl transition-all cursor-pointer shadow-xs"
              title="Check summary accuracy against a reference"
            >
              <Target className="w-4 h-4 text-blue-700 shrink-0" />
              <span className="inline">Accuracy Check</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
