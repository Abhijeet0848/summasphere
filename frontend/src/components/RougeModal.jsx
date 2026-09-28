import React, { useState, useRef } from 'react';
import { evaluateRouge, extractDocument } from '../services/api';
import { Upload, FileText, CheckCircle2, Sparkles, X } from 'lucide-react';

const BENCHMARK_TEST_CASES = [
  {
    id: 1,
    name: 'AI in Healthcare (EN)',
    candidate: "Hospitals use deep learning algorithms to detect diabetic retinopathy and lung diseases from medical scans. Clinical research teams are also employing neural networks to accelerate drug discovery pipelines.",
    reference: "Artificial intelligence is transforming modern healthcare through advanced predictive models. Automated diagnostic tools assist radiologists and accelerate drug discovery pipelines."
  },
  {
    id: 2,
    name: 'Renewable Solar Grids (EN)',
    candidate: "Renewable energy generation has expanded rapidly due to declining photovoltaic cell costs. Transitioning from fossil fuels to clean energy is essential to combating global climate change.",
    reference: "Renewable energy generation has expanded rapidly due to declining photovoltaic cell costs. Transitioning from fossil fuels to clean energy is essential to combating global climate change."
  },
  {
    id: 3,
    name: 'Quantum Computing (EN)',
    candidate: "Quantum computers utilize quantum mechanical phenomena like superposition and entanglement to compute. Unlike classical bits that are either zero or one, quantum qubits can exist in multiple states simultaneously.",
    reference: "Quantum computers utilize quantum mechanical phenomena like superposition and entanglement to compute. Cryptographers are developing post-quantum cryptographic standards to safeguard internet security."
  },
  {
    id: 4,
    name: 'Global Economics & Inflation (EN)',
    candidate: "Central banks utilize interest rate adjustments as their primary tool to manage persistent inflation. When inflation surges beyond statutory targets, monetary authorities raise baseline policy rates to cool demand.",
    reference: "Central banks utilize interest rate adjustments as their primary tool to manage persistent inflation. Achieving a soft landing without triggering an economic recession is the principal goal of monetary policymakers."
  },
  {
    id: 5,
    name: 'James Webb Space Telescope (EN)',
    candidate: "The James Webb Space Telescope observes the universe primarily in the infrared spectrum with unprecedented clarity. Webb orbits the Sun at the Second Lagrange Point, roughly one million miles from Earth.",
    reference: "The James Webb Space Telescope observes the universe primarily in the infrared spectrum with unprecedented clarity. These high-resolution deep-space observations are reshaping our fundamental understanding of cosmic origin."
  },
  {
    id: 6,
    name: 'Indus Valley Civilization (EN)',
    candidate: "The Indus Valley Civilization was a Bronze Age civilization known for sophisticated urban planning and drainage. The civilization declined around 1900 BCE likely due to tectonic shifts and changing monsoon weather patterns.",
    reference: "The Indus Valley Civilization was a Bronze Age civilization known for sophisticated urban planning and drainage. Cities like Harappa and Mohenjo-daro featured grid-based street layouts and standardized brick construction."
  },
  {
    id: 7,
    name: 'ISRO Chandrayaan-3 (HI 🇮🇳)',
    candidate: "भारतीय अंतरिक्ष अनुसंधान संगठन भारत की राष्ट्रीय अंतरिक्ष एजेंसी है जो अंतरिक्ष अभियानों का संचालन करती है। इस ऐतिहासिक अभियान ने भारत को चंद्रमा के दक्षिणी ध्रुव पर उतरने वाला दुनिया का पहला देश बना दिया।",
    reference: "भारतीय अंतरिक्ष अनुसंधान संगठन भारत की राष्ट्रीय अंतरिक्ष एजेंसी है। इसरो ने चंद्रमा के दक्षिणी ध्रुव पर चंद्रयान-3 का सफल लैंडर उतारकर ऐतिहासिक उपलब्धि हासिल की।"
  },
  {
    id: 8,
    name: 'Digital India & UPI (HI 🇮🇳)',
    candidate: "यूनिफाइड पेमेंट्स इंटरफेस यानी यूपीआई ने भारत में डिजिटल भुगतान प्रणाली में क्रांतिकारी बदलाव किया है। भारतीय राष्ट्रीय भुगतान निगम द्वारा संचालित यह प्रणाली अब अंतरराष्ट्रीय स्तर पर भी स्वीकार की जा रही है।",
    reference: "यूनिफाइड पेमेंट्स इंटरफेस यानी यूपीआई ने भारत में डिजिटल भुगतान प्रणाली में क्रांतिकारी बदलाव किया है। डिजिटल वित्तीय समावेशन ने भारतीय अर्थव्यवस्था को अधिक पारदर्शी और सशक्त बनाया है।"
  },
  {
    id: 9,
    name: 'Cybersecurity & MFA (EN)',
    candidate: "Cybersecurity defenses rely heavily on robust multi-factor authentication to protect sensitive digital infrastructure.",
    reference: "Cybersecurity defenses rely heavily on robust multi-factor authentication to protect sensitive digital infrastructure."
  },
  {
    id: 10,
    name: 'Deep Learning & Attention (EN)',
    candidate: "By capturing long-range semantic dependencies between words, attention mechanisms overcome recurrent neural network bottlenecks. Pre-trained language models fine-tuned on specialized domain corpora demonstrate outstanding contextual comprehension. Scaling laws demonstrate that increased model parameters and high-quality training datasets consistently boost inference accuracy.",
    reference: "Deep neural networks represent the cornerstone of contemporary machine learning and natural language processing. Transformer architectures rely on multi-head self-attention mechanisms to process sequential text data in parallel. Scaling laws demonstrate that increased parameters and high-quality datasets consistently boost inference accuracy."
  }
];

export default function RougeModal({ isOpen, onClose, candidateSummary }) {
  const [reference, setReference] = useState('');
  const [candidate, setCandidate] = useState(candidateSummary || '');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extractingFile, setExtractingFile] = useState(null); // 'candidate' | 'reference'
  const [error, setError] = useState('');

  const candidateFileRef = useRef(null);
  const referenceFileRef = useRef(null);

  React.useEffect(() => {
    if (candidateSummary) {
      setCandidate(candidateSummary);
    }
  }, [candidateSummary]);

  const handleFileUpload = async (file, target) => {
    if (!file) return;
    setError('');
    setExtractingFile(target);

    try {
      if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const text = await file.text();
        if (target === 'candidate') setCandidate(text);
        if (target === 'reference') setReference(text);
      } else {
        const data = await extractDocument(file);
        if (target === 'candidate') setCandidate(data.text);
        if (target === 'reference') setReference(data.text);
      }
    } catch (err) {
      setError(`Failed to read file: ${err.message || 'Unknown error'}`);
    } finally {
      setExtractingFile(null);
      if (candidateFileRef.current) candidateFileRef.current.value = '';
      if (referenceFileRef.current) referenceFileRef.current.value = '';
    }
  };

  const handleSelectBenchmark = (tc) => {
    setCandidate(tc.candidate);
    setReference(tc.reference);
    setResults(null);
    setError('');
  };

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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/80">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-2">
              <span>🎯</span>
              <span>Accuracy Evaluation Studio (ROUGE & File Tests)</span>
            </h3>
            <p className="text-xs sm:text-sm font-normal text-slate-600">
              Upload reference files or select pre-configured test cases to measure summarization accuracy.
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

          {/* 10 Test Cases Quick-Pick Toolbar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>10 Pre-loaded Accuracy Test Cases:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
              {BENCHMARK_TEST_CASES.map((tc) => (
                <button
                  key={tc.id}
                  type="button"
                  onClick={() => handleSelectBenchmark(tc)}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 rounded-lg transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  #{tc.id} {tc.name}
                </button>
              ))}
            </div>
          </div>

          {/* Two-Column Input with File Uploaders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Generated / Candidate Summary */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Generated Summary:</span>
                </label>
                <button
                  type="button"
                  onClick={() => candidateFileRef.current?.click()}
                  disabled={extractingFile === 'candidate'}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md transition-all cursor-pointer active:scale-95"
                >
                  <Upload className="w-3 h-3" />
                  <span>{extractingFile === 'candidate' ? 'Reading...' : 'Upload File'}</span>
                </button>
                <input
                  ref={candidateFileRef}
                  type="file"
                  accept=".txt,.md"
                  onChange={(e) => handleFileUpload(e.target.files?.[0], 'candidate')}
                  className="hidden"
                />
              </div>
              <textarea
                value={candidate}
                onChange={(e) => setCandidate(e.target.value)}
                placeholder="Paste or upload generated summary..."
                className="w-full h-28 sm:h-36 p-3 text-xs sm:text-sm font-normal bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 focus:bg-white resize-none text-slate-800 placeholder:text-slate-400"
              />
            </div>

            {/* Reference Summary */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Reference Summary (Ground Truth):</span>
                </label>
                <button
                  type="button"
                  onClick={() => referenceFileRef.current?.click()}
                  disabled={extractingFile === 'reference'}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md transition-all cursor-pointer active:scale-95"
                >
                  <Upload className="w-3 h-3" />
                  <span>{extractingFile === 'reference' ? 'Reading...' : 'Upload File'}</span>
                </button>
                <input
                  ref={referenceFileRef}
                  type="file"
                  accept=".txt,.md"
                  onChange={(e) => handleFileUpload(e.target.files?.[0], 'reference')}
                  className="hidden"
                />
              </div>
              <textarea
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Paste or upload reference summary / ground truth..."
                className="w-full h-28 sm:h-36 p-3 text-xs sm:text-sm font-normal bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600 focus:bg-white resize-none text-slate-800 placeholder:text-slate-400"
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
                <span>Evaluating Accuracy...</span>
              </>
            ) : (
              <>
                <span>🎯</span>
                <span>Evaluate Accuracy (ROUGE-1, ROUGE-2, ROUGE-L)</span>
              </>
            )}
          </button>

          {/* Results Display */}
          {results && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 space-y-3 animate-in fade-in duration-150">
              <div className="flex justify-between items-center">
                <h4 className="text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider">
                  Academic Accuracy Evaluation Results:
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
                      Vocabulary & content coverage overlap.
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
                      2-word phrase fluency and context preservation.
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
                      Structural word sequence & sentence flow.
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
                  <div><strong>Precision (P):</strong> Fraction of summary words present in reference.</div>
                  <div><strong>Recall (R):</strong> Fraction of reference words captured by summary.</div>
                  <div><strong>F1-Score:</strong> Harmonic balance of Precision and Recall.</div>
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
