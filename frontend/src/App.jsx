import React, { useState } from 'react';
import Header from './components/Header';
import InputSection from './components/InputSection';
import OutputSection from './components/OutputSection';
import StatsGrid from './components/StatsGrid';
import ScoreChart from './components/ScoreChart';
import SentenceTable from './components/SentenceTable';
import NLPAnalysis from './components/NLPAnalysis';
import PipelineInspector from './components/PipelineInspector';
import ComparisonSection from './components/ComparisonSection';
import HistoryPage from './components/HistoryPage';
import RougeModal from './components/RougeModal';
import BottomNavBar from './components/BottomNavBar';
import { summarizeText, compareAlgorithms } from './services/api';

export default function App() {
  const [currentView, setCurrentView] = useState('workspace'); // 'workspace' | 'nlp_analysis' | 'ranking' | 'analytics' | 'compare' | 'history'

  const [text, setText] = useState('');
  const [method, setMethod] = useState('hybrid');
  const [numSentences, setNumSentences] = useState(3);
  const [weightFreq, setWeightFreq] = useState(0.5);
  const [weightTfidf, setWeightTfidf] = useState(0.5);

  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Multi-Algorithm Comparison state
  const [compareData, setCompareData] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [referenceSummary, setReferenceSummary] = useState('');

  const [isRougeOpen, setIsRougeOpen] = useState(false);

  const handleSummarize = async () => {
    if (!text.trim()) {
      setError('Please paste, type, or upload an article before summarizing.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const data = await summarizeText({
        text,
        method,
        num_sentences: numSentences,
        weight_frequency: weightFreq,
        weight_tfidf: weightTfidf,
      });
      setSummaryData(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to generate summary. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunCompare = async () => {
    if (!text.trim()) {
      setError('Please provide an article in the Summarizer Studio before running comparison.');
      return;
    }
    setError('');
    setCompareLoading(true);

    try {
      const data = await compareAlgorithms({
        text,
        num_sentences: numSentences,
        weight_frequency: weightFreq,
        weight_tfidf: weightTfidf,
        reference_summary: referenceSummary,
      });
      setCompareData(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Algorithm comparison failed.');
    } finally {
      setCompareLoading(false);
    }
  };

  const handleSelectHistoryRecord = (record) => {
    if (record.original_text) {
      setText(record.original_text);
    }
    if (record.method) {
      setMethod(record.method);
    }
    setSummaryData({
      summary: record.summary,
      method: record.method,
      original_sentence_count: record.original_sentence_count || record.num_selected_sentences,
      summary_sentence_count: record.num_selected_sentences,
      original_word_count: record.original_word_count,
      summary_word_count: record.summary_word_count,
      compression_ratio: record.compression_ratio,
      processing_time_ms: record.processing_time_ms,
      sentences: [],
    });
    setCurrentView('workspace');
  };

  const renderEmptyState = (title, description) => (
    <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-xs my-6 max-w-xl mx-auto">
      <div className="w-14 h-14 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 border border-blue-200 shadow-2xs">
        📊
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1.5">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-600 font-normal mb-5 leading-relaxed">{description}</p>
      <button
        onClick={() => setCurrentView('workspace')}
        className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs hover:shadow-sm transition-all duration-200 cursor-pointer"
      >
        <span>⚡</span>
        <span>Go to Summarizer</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100/90 text-slate-900 font-sans">
      {/* Top Navigation */}
      <Header
        currentView={currentView}
        setView={setCurrentView}
        onOpenRouge={() => setIsRougeOpen(true)}
        hasSummary={!!summaryData}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 pb-28 lg:pb-6">
        {/* Error Alert */}
        {error && (
          <div className="mb-3 p-3 bg-red-50/90 border border-red-200 rounded-xl text-xs sm:text-sm font-semibold text-red-900 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError('')}
              className="text-red-700 hover:text-red-900 font-bold text-sm cursor-pointer ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* 1. Summarizer Studio View */}
        {currentView === 'workspace' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-stretch">
              <InputSection
                text={text}
                setText={setText}
                method={method}
                setMethod={setMethod}
                numSentences={numSentences}
                setNumSentences={setNumSentences}
                weightFreq={weightFreq}
                setWeightFreq={setWeightFreq}
                weightTfidf={weightTfidf}
                setWeightTfidf={setWeightTfidf}
                onSummarize={handleSummarize}
                loading={loading}
              />

              <OutputSection
                summary={summaryData?.summary || ''}
                method={summaryData?.method || method}
                compressionRatio={summaryData?.compression_ratio || 0}
                isExtractiveVerified={summaryData?.is_extractive_verified ?? true}
                loading={loading}
              />
            </div>

            {/* If summary generated, show Quick Stats and direct jump cards */}
            {summaryData && (
              <div className="space-y-4 animate-fade-up">
                <StatsGrid stats={summaryData} />

                {/* Quick Navigation Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <button
                    onClick={() => setCurrentView('nlp_analysis')}
                    className="p-4 bg-white border border-slate-200 hover:border-blue-500 rounded-2xl text-left transition-all hover:shadow-md group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-900 mb-1">
                      <span className="p-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">🔬</span>
                      <span>NLP Analysis</span>
                      <span className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity ml-auto font-bold">→</span>
                    </div>
                    <p className="text-xs sm:text-sm font-normal text-slate-600 leading-relaxed">
                      View tokens, removed stop-words, and word lemmas.
                    </p>
                  </button>

                  <button
                    onClick={() => setCurrentView('ranking')}
                    className="p-4 bg-white border border-slate-200 hover:border-indigo-500 rounded-2xl text-left transition-all hover:shadow-md group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-900 mb-1">
                      <span className="p-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">📋</span>
                      <span>Sentence Scores</span>
                      <span className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity ml-auto font-bold">→</span>
                    </div>
                    <p className="text-xs sm:text-sm font-normal text-slate-600 leading-relaxed">
                      View scores and ranking for each sentence.
                    </p>
                  </button>

                  <button
                    onClick={() => setCurrentView('analytics')}
                    className="p-4 bg-white border border-slate-200 hover:border-violet-500 rounded-2xl text-left transition-all hover:shadow-md group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-900 mb-1">
                      <span className="p-1 rounded-lg bg-violet-50 text-violet-700 border border-violet-100">📊</span>
                      <span>Stats & Charts</span>
                      <span className="text-violet-600 opacity-0 group-hover:opacity-100 transition-opacity ml-auto font-bold">→</span>
                    </div>
                    <p className="text-xs sm:text-sm font-normal text-slate-600 leading-relaxed">
                      Word frequencies and sentence score distributions.
                    </p>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. NLP Analysis View */}
        {currentView === 'nlp_analysis' && (
          <div className="space-y-5">
            {summaryData ? (
              <NLPAnalysis
                summaryData={summaryData}
                originalText={text}
              />
            ) : (
              renderEmptyState(
                'No NLP Analysis Data Yet',
                'Create a summary first to inspect tokenization, stop-word removal, and lemmatization.'
              )
            )}
          </div>
        )}

        {/* 3. Sentence Ranking View */}
        {currentView === 'ranking' && (
          <div className="space-y-5">
            {summaryData?.sentences && summaryData.sentences.length > 0 ? (
              <SentenceTable sentences={summaryData.sentences} />
            ) : (
              renderEmptyState(
                'No Sentence Scores Yet',
                'Create a summary first to see how each sentence is ranked.'
              )
            )}
          </div>
        )}

        {/* 4. Stats & Charts Analytics View */}
        {currentView === 'analytics' && (
          <div className="space-y-5">
            {summaryData ? (
              <>
                <StatsGrid stats={summaryData} />
                {summaryData?.sentences && summaryData.sentences.length > 0 ? (
                  <ScoreChart
                    sentences={summaryData.sentences}
                    wordFrequencies={summaryData.word_frequencies}
                    stats={summaryData}
                    originalText={text}
                  />
                ) : (
                  <div className="bg-white p-6 rounded-2xl border border-slate-300 text-center text-xs sm:text-sm font-bold text-slate-800">
                    No sentence details available for this summary.
                  </div>
                )}
              </>
            ) : (
              renderEmptyState(
                'No Summary Data Yet',
                'Create a summary first to see charts and numbers.'
              )
            )}
          </div>
        )}

        {/* 5. Algorithm Comparison View */}
        {currentView === 'compare' && (
          <div className="space-y-5">
            <ComparisonSection
              compareData={compareData}
              loading={compareLoading}
              onRunCompare={handleRunCompare}
              referenceSummary={referenceSummary}
              setReferenceSummary={setReferenceSummary}
            />
          </div>
        )}

        {/* 6. History Database View */}
        {currentView === 'history' && (
          <HistoryPage
            onSelectRecord={handleSelectHistoryRecord}
            onBackToWorkspace={() => setCurrentView('workspace')}
          />
        )}
      </main>

      {/* ROUGE Modal */}
      <RougeModal
        isOpen={isRougeOpen}
        onClose={() => setIsRougeOpen(false)}
        candidateSummary={summaryData?.summary || ''}
      />

      {/* Footer */}
      <footer className="border-t border-slate-300 bg-white py-2.5 pb-24 lg:pb-2.5 text-center text-[11px] sm:text-xs text-slate-800 font-bold shadow-2xs">
        <p>
          <span className="font-extrabold text-blue-950">SummaSphere</span> &bull; Intelligent Extractive Text Summarization System
        </p>
      </footer>

      {/* Floating Sticky Bottom Navigation Bar */}
      <BottomNavBar
        currentView={currentView}
        setView={setCurrentView}
        onOpenRouge={() => setIsRougeOpen(true)}
        hasSummary={!!summaryData}
      />
    </div>
  );
}
