# Algorithm Documentation & Mathematical Foundations

## Extractive Text Summarization Algorithms

---

### 1. NLP Preprocessing Pipeline

Extractive summarization relies on clean textual representations. The multi-stage pipeline executes sequentially:

```
Original Text
     │
     ▼
[1. Text Cleaning] ─────────► Decodes HTML entities, strips tags, normalizes whitespace
     │
     ▼
[2. Sentence Segmentation] ─► Splits on (.!?) followed by uppercase/quotes -> S_1, S_2, ... S_N
     │
     ▼
[3. Word Tokenization] ─────► Extracts alphanumeric word tokens
     │
     ▼
[4. Lowercasing] ───────────► Converts all tokens to lowercase
     │
     ▼
[5. Stop-word Removal] ─────► Filters high-frequency functional words (e.g. 'the', 'is')
     │
     ▼
[6. Lemmatization] ─────────► Reduces inflected words to dictionary roots (e.g. 'records' -> 'record')
```

---

### 2. Extractive Algorithms

#### A. Frequency-Based Summarization (Luhn's Paradigm)

**Core Principle**: Content words that appear frequently throughout a document carry the central semantic themes. Sentences containing high concentrations of these frequent words are the most informative.

**Mathematical Formulation**:
1. **Raw Term Frequency**:
   $$f(w) = \text{Count of token } w \text{ in document } D$$

2. **Normalized Word Weight**:
   $$W(w) = \frac{f(w)}{\max_{v \in D} f(v)}$$

3. **Sentence Scoring with Square-Root Length Normalization**:
   $$\text{Score}_{\text{Freq}}(S_i) = \frac{\sum_{w \in S_i \cap \text{ContentTokens}} W(w)}{\sqrt{|S_i| + \epsilon}}$$
   *Where $|S_i|$ is the number of meaningful content words in sentence $S_i$, and $\epsilon = 10^{-5}$ prevents division by zero.*

---

#### B. TF-IDF-Based Summarization (Vector Space Model)

**Core Principle**: Treats each sentence $S_i$ as a pseudo-document within the document corpus $\{S_1, S_2, \dots, S_N\}$. Terms that appear frequently within a sentence but are distributed discriminatively across the document receive high weights.

**Mathematical Formulation**:
1. **Term Frequency in Sentence**:
   $$\text{TF}(t, S_i) = \frac{f(t, S_i)}{|S_i|}$$

2. **Inverse Document Frequency (with Laplace Smoothing)**:
   $$\text{IDF}(t) = \ln\left(\frac{1 + N}{1 + \text{DF}(t)}\right) + 1$$
   *Where $N$ is the total number of sentences and $\text{DF}(t)$ is the number of sentences containing term $t$.*

3. **TF-IDF Weight**:
   $$\text{TF-IDF}(t, S_i) = \text{TF}(t, S_i) \times \text{IDF}(t)$$

4. **Sentence TF-IDF Score**:
   $$\text{Score}_{\text{TF-IDF}}(S_i) = \frac{\sum_{t \in S_i} \text{TF-IDF}(t, S_i)}{\sqrt{|S_i| + \epsilon}}$$

---

#### C. Hybrid Summarization (Parametric Weighted Combination)

**Core Principle**: Blends the global document-level thematic frequency with sentence-level local discriminative TF-IDF term weights.

**Mathematical Formulation**:
$$\text{Score}_{\text{Hybrid}}(S_i) = \alpha \cdot \text{Score}_{\text{Freq}}(S_i) + \beta \cdot \text{Score}_{\text{TF-IDF}}(S_i)$$

**Constraints**:
$$\alpha \ge 0, \quad \beta \ge 0, \quad \alpha + \beta = 1.0$$
*(Default configuration: $\alpha = 0.5$, $\beta = 0.5$)*

---

### 3. Sentence Ranking & Order Restoration

To maintain narrative coherence and logical flow:

1. **Descending Sort**:
   $$\text{Sorted} = \text{SortDescending}(\{S_i, \text{Score}(S_i)\}_{i=1}^N)$$

2. **Top-$K$ Selection**:
   $$\text{TopK} = \{S_{(1)}, S_{(2)}, \dots, S_{(K)}\}$$

3. **Chronological Reordering**:
   $$\text{Summary} = \text{Concatenate}(\text{SortByOriginalID}(\text{TopK}))$$

---

### 4. Telemetry & Metric Formulas

- **Compression Ratio**:
  $$\text{CR} = \frac{\text{WordCount}(\text{Summary})}{\text{WordCount}(\text{Original})}$$

- **Space Reduction Percentage**:
  $$\text{Reduction \%} = (1 - \text{CR}) \times 100\%$$

- **ROUGE-N ($N$-gram Overlap)**:
  $$\text{ROUGE-N Recall} = \frac{\sum_{S \in \text{Ref}} \sum_{\text{gram}_n \in S} \text{Count}_{\text{match}}(\text{gram}_n)}{\sum_{S \in \text{Ref}} \sum_{\text{gram}_n \in S} \text{Count}(\text{gram}_n)}$$

- **ROUGE-L (Longest Common Subsequence)**:
  $$R_{\text{LCS}} = \frac{\text{LCS}(\text{Candidate}, \text{Reference})}{m}, \quad P_{\text{LCS}} = \frac{\text{LCS}(\text{Candidate}, \text{Reference})}{n}$$
  $$F_{\text{LCS}} = \frac{(1 + \beta^2) R_{\text{LCS}} P_{\text{LCS}}}{R_{\text{LCS}} + \beta^2 P_{\text{LCS}}}$$
