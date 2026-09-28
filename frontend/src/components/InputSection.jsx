import React, { useRef, useState } from 'react';
import { extractDocument } from '../services/api';

export default function InputSection({
  text,
  setText,
  method,
  setMethod,
  numSentences,
  setNumSentences,
  weightFreq,
  setWeightFreq,
  weightTfidf,
  setWeightTfidf,
  onSummarize,
  loading
}) {
  const fileInputRef = useRef(null);
  const [docMeta, setDocMeta] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [fileError, setFileError] = useState('');

  const cleanClientText = text
    .replace(/\[(?:\\\[|\[)?\s*\d+\s*(?:\\\]|\])?\]\([^)]+\)/g, '')
    .replace(/\[([^\[\]]+)\]\((?:\\\(|\\\)|[^)])+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/(?:\\\[|\[)\s*\d+\s*(?:\\\]|\])/g, '')
    .replace(/\[\s*(?:edit|citation needed|[a-zA-Z\s]+)\s*\]/g, '')
    .replace(/\\([\[\]\(\)])/g, '$1')
    .replace(/\s*\|\s*/g, '। ')
    .trim();

  const wordCount = cleanClientText ? cleanClientText.split(/\s+/).length : 0;
  const charCount = text.length;
  const sentenceCount = cleanClientText
    ? (cleanClientText.match(/[^.!?।॥\n]+(?:[.!?।॥]+["'”’\)\]]*|$)/g) || []).filter(s => s.trim().length > 0).length
    : 0;

  const processFile = async (file) => {
    if (!file) return;
    setFileError('');

    const lowerName = file.name.toLowerCase();
    const isValidType = lowerName.endsWith('.txt') || lowerName.endsWith('.md');
    
    if (!isValidType) {
      setFileError('Unsupported file. Please upload a .TXT or .MD file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError('File is too large. Maximum size is 5 MB.');
      return;
    }

    setExtracting(true);
    try {
      const data = await extractDocument(file);
      setText(data.text);
      setDocMeta({
        filename: data.filename,
        wordCount: data.word_count,
        sentenceCount: data.sentence_count,
        fileSizeBytes: data.file_size_bytes,
        extension: data.extension
      });
    } catch (err) {
      console.error(err);
      setFileError(err.message || 'Could not read text from this file.');
    } finally {
      setExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleClear = () => {
    setText('');
    setDocMeta(null);
    setFileError('');
  };

  const isHindi = /[\u0900-\u097F]/.test(text);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 flex flex-col justify-between h-full transition-shadow hover:shadow-md">
      <div>
        {/* Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm border border-blue-100 shadow-2xs">
              📄
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                Original Text
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">Input your source document</p>
            </div>
            {text.trim() && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all ${
                isHindi
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-blue-50 text-blue-900 border-blue-200'
              }`}>
                {isHindi ? '🇮🇳 Hindi (हिंदी)' : '🌐 English (EN)'}
              </span>
            )}
          </div>
        </div>

        {/* Document Ingestion Banner */}
        {docMeta && (
          <div className="mb-2.5 p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-base shrink-0">📄</span>
              <div className="truncate">
                <div className="font-bold text-blue-950 truncate text-xs">
                  {docMeta.filename}
                </div>
                <div className="text-[11px] text-blue-800 flex flex-wrap items-center gap-1.5 font-medium">
                  <span><strong>{docMeta.wordCount.toLocaleString()}</strong> words</span>
                  <span>&bull;</span>
                  <span><strong>{docMeta.sentenceCount}</strong> sentences</span>
                  <span>&bull;</span>
                  <span><strong>{(docMeta.fileSizeBytes / 1024).toFixed(1)} KB</strong></span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDocMeta(null)}
              className="text-blue-800 hover:text-blue-950 p-1 text-xs cursor-pointer font-bold ml-1 shrink-0 rounded hover:bg-blue-100"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        {/* File Error Alert */}
        {fileError && (
          <div className="mb-2.5 p-2 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-800 flex justify-between items-center">
            <span>⚠️ {fileError}</span>
            <button onClick={() => setFileError('')} className="text-red-800 font-bold ml-2">✕</button>
          </div>
        )}

        {/* Text Area */}
        <div
          className="relative group"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (docMeta) setDocMeta(null);
            }}
            placeholder="Paste or type your English or Hindi article here, or drag & drop a .TXT / .MD file..."
            disabled={extracting}
            className="w-full h-32 sm:h-36 lg:h-40 p-3.5 text-xs sm:text-sm bg-slate-50/60 hover:bg-slate-50/90 focus:bg-white border border-slate-200/90 focus:border-blue-600 focus:ring-3 focus:ring-blue-100/60 rounded-xl transition-all outline-none resize-none leading-relaxed text-slate-900 font-normal disabled:opacity-50 placeholder:text-slate-400 shadow-inner"
          />

          {extracting && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-2xs rounded-xl flex flex-col items-center justify-center text-blue-700 gap-2 p-4 text-center">
              <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <span className="text-xs font-bold text-slate-900">Reading and parsing document...</span>
            </div>
          )}
        </div>

        {/* Word, Sentence & Char Counter + Upload Bar */}
        <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-slate-500 font-medium my-2.5 px-0.5">
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-600">
            <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/70 font-semibold">{charCount.toLocaleString()} chars</span>
            <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/70 font-semibold">{wordCount.toLocaleString()} words</span>
            {sentenceCount > 0 && (
              <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md border border-blue-200/70 font-semibold">{sentenceCount} sentences</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={extracting}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-900 bg-blue-50/80 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-all duration-150 cursor-pointer shadow-2xs active:scale-95"
            >
              <span>📁</span>
              <span>Upload .TXT</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md"
              onChange={handleFileUpload}
              className="hidden"
            />
            {text && (
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all duration-150 cursor-pointer shadow-2xs active:scale-95"
              >
                <span>✕</span>
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Controls Container */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-3.5 space-y-3 mb-3">
          {/* Method Selection (Segmented Pills) */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Summarization Method
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-200/70 p-1 rounded-xl border border-slate-300/60">
              <button
                type="button"
                onClick={() => setMethod('frequency')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  method === 'frequency'
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200 font-bold'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <span>📊</span>
                <span className="hidden sm:inline">Word Frequency</span>
                <span className="inline sm:hidden">Frequency</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod('tfidf')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  method === 'tfidf'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200 font-bold'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <span>⚡</span>
                <span>TF-IDF</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod('hybrid')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  method === 'hybrid'
                    ? 'bg-white text-violet-700 shadow-xs border border-slate-200 font-bold'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <span>🧬</span>
                <span>Hybrid</span>
              </button>
            </div>
          </div>

          {/* Sentence Slider */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-800 mb-1.5">
              <span>Summary Length</span>
              <div className="flex items-center gap-2">
                {sentenceCount > 0 && numSentences >= sentenceCount && (
                  <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                    Full extract ({sentenceCount}/{sentenceCount})
                  </span>
                )}
                <span className="text-blue-700 font-bold">
                  {numSentences} {numSentences === 1 ? 'sentence' : 'sentences'}
                </span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max={Math.max(5, Math.min(10, sentenceCount || 10))}
              value={numSentences}
              onChange={(e) => setNumSentences(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-medium px-0.5 mt-1">
              <span>1 sentence</span>
              {sentenceCount > 1 && <span>{Math.max(1, Math.floor(sentenceCount / 2))} sentences (50%)</span>}
              <span>{Math.max(5, Math.min(10, sentenceCount || 10))} sentences</span>
            </div>
          </div>

          {/* Hybrid Config */}
          {method === 'hybrid' && (
            <div className="pt-2.5 border-t border-slate-200 grid grid-cols-2 gap-3 animate-in fade-in duration-150">
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-800 mb-1">
                  <span>Frequency Weight:</span>
                  <span className="text-blue-700 font-bold">{Math.round(weightFreq * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={weightFreq}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setWeightFreq(val);
                    setWeightTfidf(Number((1 - val).toFixed(2)));
                  }}
                  className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-800 mb-1">
                  <span>TF-IDF Weight:</span>
                  <span className="text-indigo-700 font-bold">{Math.round(weightTfidf * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={weightTfidf}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setWeightTfidf(val);
                    setWeightFreq(Number((1 - val).toFixed(2)));
                  }}
                  className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3D Summarize Action Button */}
      <button
        onClick={onSummarize}
        disabled={loading || extracting || !text.trim()}
        className={`w-full py-3 px-5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 select-none cursor-pointer tracking-wide ${
          !text.trim() || loading || extracting
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
            <span className="text-white drop-shadow-xs">Summarizing...</span>
          </>
        ) : (
          <>
            <span className="text-base filter drop-shadow-xs">⚡</span>
            <span className="drop-shadow-xs">Summarize Text</span>
          </>
        )}
      </button>
    </div>
  );
}

