"""
Production 3-Tier Architecture: Flask REST Backend & Robust Zero-CDN Frontend
=============================================================================
Layer 1: NLP Engine   -> extractive_summarizer.py
Layer 2: Backend API  -> Flask REST API (/api/summarize, /api/evaluate_rouge)
Layer 3: Frontend UI  -> Responsive Zero-Dependency Clean Web Studio
"""

import os
import sys
import json
from flask import Flask, request, jsonify, Response
from extractive_summarizer import ExtractiveSummarizer

app = Flask(__name__)
summarizer = ExtractiveSummarizer()

PORT = int(os.environ.get("PORT", 8000))

UI_TEMPLATE = r"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Extractive Text Summarizer Studio</title>
  
  <style>
    :root {
      --bg: #f8fafc;
      --surface: #ffffff;
      --primary: #2563eb;
      --primary-hover: #1d4ed8;
      --text-dark: #0f172a;
      --text-muted: #64748b;
      --text-light: #94a3b8;
      --border: #e2e8f0;
      --radius: 10px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: var(--bg); color: var(--text-dark); min-height: 100vh; line-height: 1.6; }
    
    header { background: white; border-bottom: 1px solid var(--border); padding: 14px 24px; }
    .header-inner { max-width: 1100px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
    .brand { font-weight: 800; font-size: 1.15rem; color: var(--primary); display: flex; align-items: center; gap: 8px; text-decoration: none; }
    .brand-badge { font-size: 0.75rem; background: #eff6ff; color: var(--primary); padding: 4px 10px; border-radius: 999px; font-weight: 600; border: 1px solid #bfdbfe; }
    
    main { max-width: 1100px; margin: 28px auto; padding: 0 20px; }
    .hero { text-align: center; margin-bottom: 24px; }
    .hero h1 { font-size: 2rem; font-weight: 800; margin-bottom: 6px; }
    .hero p { color: var(--text-muted); font-size: 0.95rem; }

    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
    @media (max-width: 800px) { .grid { grid-template-columns: 1fr; } }
    
    .card { background: white; border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); display: flex; flex-direction: column; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .card-title { font-weight: 700; font-size: 0.95rem; }

    .chips { display: flex; gap: 6px; }
    .chip { background: #f1f5f9; border: 1px solid var(--border); color: var(--text-muted); padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; cursor: pointer; }
    .chip:hover { background: #e2e8f0; color: var(--text-dark); }

    textarea { width: 100%; height: 200px; padding: 12px; border: 1px solid var(--border); border-radius: 8px; font-family: inherit; font-size: 0.92rem; line-height: 1.6; resize: vertical; outline: none; }
    textarea:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }

    .meta-row { display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--text-muted); margin: 6px 0 14px 0; }
    
    .controls { background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
    .control-group label { display: block; font-size: 0.78rem; font-weight: 600; margin-bottom: 4px; }
    select, input[type="range"] { width: 100%; }
    select { padding: 6px 8px; border: 1px solid var(--border); border-radius: 6px; background: white; font-size: 0.85rem; outline: none; }

    .btn-submit { background: var(--primary); color: white; border: none; padding: 12px; font-weight: 600; font-size: 0.95rem; border-radius: 8px; cursor: pointer; transition: background 0.15s; display: flex; align-items: center; justify-content: center; gap: 6px; }
    .btn-submit:hover { background: var(--primary-hover); }
    .btn-submit:disabled { background: #93c5fd; cursor: not-allowed; }

    .output-area { border: 1px solid var(--border); border-radius: 8px; padding: 14px; min-height: 200px; background: white; font-size: 0.95rem; line-height: 1.7; white-space: pre-wrap; overflow-y: auto; color: var(--text-dark); }
    .placeholder { height: 170px; display: flex; align-items: center; justify-content: center; color: var(--text-light); font-size: 0.9rem; }

    .btn-copy { background: white; border: 1px solid var(--border); padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; cursor: pointer; font-weight: 500; }
    .btn-copy:hover { background: #f1f5f9; }

    .metrics-bar { display: flex; justify-content: space-around; margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border); }
    .metric { text-align: center; }
    .metric-val { font-size: 1.1rem; font-weight: 700; color: var(--text-dark); }
    .metric-lbl { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; }

    /* Tabs */
    .studio-tabs-card { background: white; border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .tab-nav { display: flex; background: #f8fafc; border-bottom: 1px solid var(--border); }
    .tab-btn { padding: 12px 18px; font-size: 0.85rem; font-weight: 600; color: var(--text-muted); background: transparent; border: none; cursor: pointer; }
    .tab-btn.active { color: var(--primary); background: white; border-bottom: 2px solid var(--primary); }
    .tab-pane { padding: 18px; display: none; }
    .tab-pane.active { display: block; }

    .score-item { padding: 8px 12px; background: #f8fafc; border-radius: 6px; margin-bottom: 6px; font-size: 0.85rem; display: flex; justify-content: space-between; gap: 12px; }
    .score-item.selected { background: #eff6ff; border-left: 3px solid var(--primary); }
    .score-num { font-weight: 700; color: var(--primary); white-space: nowrap; }

    footer { text-align: center; padding: 20px; color: var(--text-muted); font-size: 0.8rem; border-top: 1px solid var(--border); background: white; margin-top: 40px; }
  </style>
</head>
<body>

  <header>
    <div class="header-inner">
      <a href="/" class="brand">
        <span>⚡ SynapseNLP</span>
      </a>
      <span class="brand-badge">Flask REST API + NLP Engine</span>
    </div>
  </header>

  <main>
    <div class="hero">
      <h1>Extractive Text Summarizer</h1>
      <p>3-Tier NLP Pipeline: Word Frequency &bull; TF-IDF &bull; TextRank (PageRank)</p>
    </div>

    <div class="grid">
      <!-- Input Card -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Document Input</span>
          <div class="chips">
            <button class="chip" onclick="loadSample('ai')">AI Sample</button>
            <button class="chip" onclick="loadSample('science')">Science Sample</button>
          </div>
        </div>

        <textarea id="inputText" placeholder="Paste your article or raw text here..." oninput="updateStats()"></textarea>

        <div class="meta-row">
          <span id="statLabel">0 characters &bull; 0 words</span>
          <span style="cursor: pointer; color: #ef4444;" onclick="clearInput()">Clear</span>
        </div>

        <div class="controls">
          <div class="control-group">
            <label>NLP Algorithm</label>
            <select id="algoSelect">
              <option value="frequency">Normalized Word Frequency</option>
              <option value="tfidf">TF-IDF Scoring</option>
              <option value="textrank">TextRank (PageRank Graph)</option>
            </select>
          </div>

          <div class="control-group">
            <label>Summary Length (<span id="lenDisplay">3 sentences</span>)</label>
            <input type="range" id="lengthSlider" min="1" max="8" value="3" oninput="document.getElementById('lenDisplay').innerText = this.value + (this.value == 1 ? ' sentence' : ' sentences')">
          </div>
        </div>

        <button class="btn-submit" id="summarizeBtn" onclick="runSummarize()">
          <span>Generate Summary</span>
        </button>
      </div>

      <!-- Output Card -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Extracted Summary</span>
          <button class="btn-copy" id="copyBtn" onclick="copySummary()" style="display: none;">Copy Summary</button>
        </div>

        <div class="output-area" id="outputArea">
          <div class="placeholder" id="placeholderMsg">Summary will appear here after clicking Generate Summary.</div>
        </div>

        <div class="metrics-bar" id="metricsBar" style="display: none;">
          <div class="metric">
            <div class="metric-val" id="metSentences">0 / 0</div>
            <div class="metric-lbl">Sentences</div>
          </div>
          <div class="metric">
            <div class="metric-val" id="metRatio">0%</div>
            <div class="metric-lbl">Reduction</div>
          </div>
          <div class="metric">
            <div class="metric-val" id="metWords">0</div>
            <div class="metric-lbl">Words</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Analytics & Details Drawer -->
    <div class="studio-tabs-card">
      <div class="tab-nav">
        <button class="tab-btn active" onclick="switchTab('tabScores')">Sentence Ranking & Scores</button>
        <button class="tab-btn" onclick="switchTab('tabArch')">System Architecture (3-Tier Model)</button>
      </div>

      <div id="tabScores" class="tab-pane active">
        <div id="scoresContainer">
          <p style="color: var(--text-muted); font-size: 0.85rem;">Run summarization above to inspect individual sentence score allocations.</p>
        </div>
      </div>

      <div id="tabArch" class="tab-pane">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px;">
          <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: 14px;">
            <strong style="color: var(--primary); font-size: 0.9rem;">Layer 1: NLP Engine</strong>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;"><code>extractive_summarizer.py</code> handles tokenization, lemmatization, Word Frequency, TF-IDF, and TextRank matrix convergence.</p>
          </div>
          <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: 14px;">
            <strong style="color: var(--primary); font-size: 0.9rem;">Layer 2: Backend API</strong>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Flask REST Microframework exposes <code>POST /api/summarize</code>, returning JSON data payloads.</p>
          </div>
          <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: 14px;">
            <strong style="color: var(--primary); font-size: 0.9rem;">Layer 3: Frontend UI</strong>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Clean web studio with parameter sliders, real-time stats, and responsive summary extraction display.</p>
          </div>
        </div>
      </div>
    </div>
  </main>

  <footer>
    <p>Extractive Text Summarizer &bull; 3-Tier Architecture &bull; REST API: <code>POST /api/summarize</code></p>
  </footer>

  <script>
    const samples = {
      ai: `Natural Language Processing (NLP) is a critical subfield of artificial intelligence, computer science, and linguistics. It focuses on the multifaceted interactions between computational systems and human language. In recent years, transformer-based deep learning architectures have achieved extraordinary breakthroughs across machine translation, question answering, sentiment analysis, and automated text summarization. Text summarization is the computational discipline of distilling a voluminous text document into a succinct, coherent, and highly informative version without sacrificing fundamental semantic meaning. Extractive summarization operates by identifying, mathematically scoring, and selecting the most salient sentences directly from the original source text. Extractive models offer superior factual consistency, interpretability, and computational efficiency for enterprise document processing.`,
      science: `Photosynthesis is the fundamental biological process by which green plants and certain organisms transform light energy into chemical energy. During photosynthesis in green plants, light energy is captured by chlorophyll pigments and used to convert water, carbon dioxide, and minerals into oxygen and energy-rich organic compounds. Without photosynthesis, the Earth's atmosphere would lack oxygen, making aerobic life impossible. Research into artificial photosynthesis aims to replicate this natural solar energy conversion to produce clean hydrogen fuels.`
    };

    function loadSample(key) {
      document.getElementById('inputText').value = samples[key];
      updateStats();
    }

    function clearInput() {
      document.getElementById('inputText').value = '';
      updateStats();
    }

    function updateStats() {
      const text = document.getElementById('inputText').value;
      const chars = text.length;
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      document.getElementById('statLabel').innerText = `${chars} characters • ${words} words`;
    }

    function switchTab(tabId) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      event.currentTarget.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    }

    async function runSummarize() {
      const text = document.getElementById('inputText').value.trim();
      if (!text) {
        alert('Please paste or type some text first.');
        return;
      }

      const algorithm = document.getElementById('algoSelect').value;
      const topN = parseInt(document.getElementById('lengthSlider').value, 10);
      const btn = document.getElementById('summarizeBtn');

      btn.innerText = 'Processing NLP Pipeline...';
      btn.disabled = true;

      try {
        const response = await fetch('/api/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, algorithm, top_n: topN })
        });

        if (!response.ok) {
          throw new Error('HTTP error ' + response.status);
        }

        const data = await response.json();

        // Render Summary
        const outputArea = document.getElementById('outputArea');
        outputArea.innerText = data.summary || 'No summary could be extracted.';

        // Show Copy Button
        document.getElementById('copyBtn').style.display = 'inline-block';

        // Calculate Reduction & Update Metrics
        const origWords = text.split(/\s+/).length;
        const summaryWords = data.summary ? data.summary.split(/\s+/).length : 0;
        const reductionPct = Math.max(0, Math.round((1 - (summaryWords / Math.max(origWords, 1))) * 100));

        document.getElementById('metSentences').innerText = `${data.metrics.summary_sentences} / ${data.metrics.original_sentences}`;
        document.getElementById('metRatio').innerText = `${reductionPct}%`;
        document.getElementById('metWords').innerText = summaryWords;
        document.getElementById('metricsBar').style.display = 'flex';

        // Populate Scores List
        const extractedIndices = new Set(data.extracted_sentences.map(s => s.index));
        let listHtml = '';
        data.sentence_scores.forEach(s => {
          const isSelected = extractedIndices.has(s.index);
          listHtml += `
            <div class="score-item ${isSelected ? 'selected' : ''}">
              <span><strong>[Sentence ${s.index + 1}]</strong> ${s.sentence}</span>
              <span class="score-num">Score: ${s.score.toFixed(3)}</span>
            </div>
          `;
        });
        document.getElementById('scoresContainer').innerHTML = listHtml;

      } catch (err) {
        console.error(err);
        alert('Error communicating with backend API: ' + err.message);
      } finally {
        btn.innerText = 'Generate Summary';
        btn.disabled = false;
      }
    }

    function copySummary() {
      const summary = document.getElementById('outputArea').innerText;
      if (!summary) return;
      navigator.clipboard.writeText(summary);
      const btn = document.getElementById('copyBtn');
      btn.innerText = 'Copied!';
      setTimeout(() => btn.innerText = 'Copy Summary', 2000);
    }
  </script>
</body>
</html>
"""

@app.route("/", methods=["GET"])
def index():
    return Response(UI_TEMPLATE, mimetype="text/html")



@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "service": "3-Tier Extractive Summarizer",
        "algorithms": ["frequency", "tfidf", "textrank"]
    })


@app.route("/api/summarize", methods=["POST"])
def api_summarize():
    data = request.get_json(force=True, silent=True) or {}
    text = data.get("text", "")
    algorithm = data.get("algorithm", "frequency")
    top_n = data.get("top_n", 3)
    ratio = data.get("ratio", None)
    use_position = data.get("use_position_weight", False)

    try:
        result = summarizer.summarize(
            text,
            algorithm=algorithm,
            top_n=top_n,
            ratio=ratio,
            use_position_weight=use_position
        )
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/evaluate_rouge", methods=["POST"])
def api_evaluate_rouge():
    data = request.get_json(force=True, silent=True) or {}
    candidate = data.get("candidate", "")
    reference = data.get("reference", "")

    try:
        rouge_scores = summarizer.calculate_rouge(candidate, reference)
        return jsonify(rouge_scores), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print(f"Server running on http://localhost:{PORT}")
    app.run(host="0.0.0.0", port=PORT, debug=False)
