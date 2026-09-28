/**
 * Frontend API Service Layer
 * Connects React UI to FastAPI Backend
 */

const API_BASE = (typeof window !== "undefined" && (window.location.port === "5173" || window.location.port === "3000" && !window.location.pathname.startsWith("/assets")))
  ? ""
  : "";


export async function extractDocument(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/api/extract_document`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `File extraction failed (${response.status})`);
  }

  return response.json();
}


export async function summarizeText({ text, method = "frequency", num_sentences = 3, weight_frequency = 0.5, weight_tfidf = 0.5 }) {

  const response = await fetch(`${API_BASE}/api/summarize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      method,
      num_sentences: Number(num_sentences),
      weight_frequency: Number(weight_frequency),
      weight_tfidf: Number(weight_tfidf),
      save_to_history: true
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server responded with status ${response.status}`);
  }

  return response.json();
}

export async function compareAlgorithms({ text, num_sentences = 3, weight_frequency = 0.5, weight_tfidf = 0.5, reference_summary = null }) {
  const response = await fetch(`${API_BASE}/api/compare`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      num_sentences: Number(num_sentences),
      weight_frequency: Number(weight_frequency),
      weight_tfidf: Number(weight_tfidf),
      reference_summary: reference_summary?.trim() || null,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Comparison failed (${response.status})`);
  }

  return response.json();
}


export async function evaluateRouge({ candidate, reference }) {
  const response = await fetch(`${API_BASE}/api/evaluate_rouge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ candidate, reference }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to evaluate ROUGE scores");
  }

  return response.json();
}

export async function fetchHistory() {
  const response = await fetch(`${API_BASE}/api/history`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to load history");
  }
  return response.json();
}

export async function fetchHistoryRecord(id) {
  const response = await fetch(`${API_BASE}/api/history/${id}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to load history record #${id}`);
  }
  return response.json();
}

export async function createHistoryRecord(payload) {
  const response = await fetch(`${API_BASE}/api/history`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to save history record");
  }
  return response.json();
}

export async function deleteHistoryRecord(id) {
  const response = await fetch(`${API_BASE}/api/history/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to delete history item");
  }
  return response.json();
}

export async function clearAllHistory() {
  const response = await fetch(`${API_BASE}/api/history`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to clear history");
  }
  return response.json();
}

