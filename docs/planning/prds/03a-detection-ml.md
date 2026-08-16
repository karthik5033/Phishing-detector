# Sub-PRD: Detection & ML

> **Document:** `docs/planning/prds/03a-detection-ml.md`
> **Owner:** ML/Cybersecurity Lead (Member 3)
> **Depends on:** [System Design](../02-system-design.md)
> **Status:** Sub-PRD — must not contradict System Design

---

## Contracts Consumed

| Contract | Source | Section |
|---|---|---|
| `EvidenceSignal` schema | [System Design](../02-system-design.md#35-investigation-agent--evidence-fusion-evidence-signals) | §3.5 |
| `EvidenceFusionResult` schema | [System Design](../02-system-design.md#35-investigation-agent--evidence-fusion-evidence-signals) | §3.5 |
| `Verdict` schema | [System Design](../02-system-design.md#36-evidence-fusion--threat-reasoner-verdict-generation) | §3.6 |
| `DetectionResult` schema | [System Design](../02-system-design.md#31-extension--backend-detection-request) | §3.1 |
| `risk_level` enum (`Low \| Medium \| High \| Critical`) | [System Design](../02-system-design.md#13-enums-and-status-values) | §1.3 |
| `verdict_label` enum | [System Design](../02-system-design.md#13-enums-and-status-values) | §1.3 |

## Contracts Produced

| Contract | Consumers |
|---|---|
| `DetectionResult` (from `/api/v1/detect`) | [Extension](./03c-extension.md), [Backend API](./03b-backend-api.md) |
| `EvidenceSignal` objects (evidence signals for evidence fusion) | Investigation Agent feeds these in, Evidence Fusion consumes |
| `EvidenceFusionResult` (fused probability + feature importances) | [Threat Reasoner / Investigation Agent](./03e-investigation-agent.md) |
| `Verdict` object (explainable verdict) | [Backend API](./03b-backend-api.md), [Extension](./03c-extension.md), [Dashboard](./03d-dashboard-ui.md) |

---

## Scope

### In Scope

1. Retrain the LightGBM URL classifier with proper methodology
2. Build the Evidence Fusion stacked meta-model
3. Build the Threat Reasoner (explainable verdict generation)
4. Add visual/logo similarity detection (Upgrade — if time allows)
5. Clean up dead models and training artifacts
6. Define the social engineering / urgency language detection signals
7. Define all `EvidenceSignal` types the Investigation Agent should collect

### Out of Scope

- The Investigation Agent itself (see [03e-investigation-agent.md](./03e-investigation-agent.md))
- The Policy Engine (see [03f-policy-engine.md](./03f-policy-engine.md))
- The API routes (see [03b-backend-api.md](./03b-backend-api.md))
- Threat intelligence feed integration (Upgrade feature — not Core)

---

## 1. LightGBM URL Classifier — Retrain Plan

### 1.1 Current State

The existing model ([`models/phishing_lgbm.joblib`](../../../models/phishing_lgbm.joblib)) is trained on ~300K samples with 29 URL-based features. Reported metrics: AUC-ROC 0.9931, F1 0.9659, optimal threshold 0.767.

**Issues with current training:**
- No evidence of class-imbalance handling (phishing URLs are typically a minority class)
- No domain-level splitting — the same domain could appear in both train and test, inflating metrics
- Temporal leakage risk — no guarantee that test data is chronologically after training data
- Multiple dead models exist alongside the active one, creating confusion

### 1.2 Retrain Methodology

#### Dataset Preparation

1. **Combine existing datasets:** Merge [`ext_data/training_final.csv`](../../../ext_data/training_final.csv) with any additional verified data
2. **Domain-level deduplication:** Group all URLs by their registered domain. All URLs from the same domain go into either train or test — never split across
3. **Temporal ordering:** If timestamps are available, ensure test set contains only URLs from after the training period
4. **Class balancing:** Apply class-weighted loss (`scale_pos_weight` parameter in LightGBM) rather than SMOTE — it's simpler and avoids synthetic sample artifacts

#### Feature Engineering (additions to existing 29 features)

| # | Feature | Type | Rationale |
|---|---|---|---|
| 30 | `levenshtein_to_top_brand` | float | Min Levenshtein edit distance to nearest brand in known_brands list. Distance 1-2 is strong typosquatting signal |
| 31 | `domain_age_proxy` | int | Whether domain uses common free/new TLDs (xyz, top, click) — binary flag |
| 32 | `has_brand_in_path` | int | Brand name appears in URL path (not domain) — common phishing pattern |
| 33 | `url_token_count` | int | Number of meaningful tokens when splitting URL by separators |
| 34 | `tld_rarity_score` | float | How uncommon the TLD is relative to Tranco top 10K |
| 35 | `subdomain_brand_distance` | float | Levenshtein distance between subdomain and known brands |

#### Training Configuration

```python
params = {
    'objective': 'binary',
    'metric': ['auc', 'binary_logloss'],
    'boosting_type': 'gbdt',
    'num_leaves': 63,
    'learning_rate': 0.05,
    'feature_fraction': 0.8,
    'bagging_fraction': 0.8,
    'bagging_freq': 5,
    'scale_pos_weight': negative_count / positive_count,  # class balancing
    'verbose': -1,
    'n_estimators': 2000,
    'early_stopping_rounds': 100
}
```

#### Evaluation Protocol

1. **Primary metrics:** Precision, Recall, F1, AUC-ROC, PR-AUC on domain-level split test set
2. **Focus:** Optimize for **recall** (catching real phishing) while keeping false positive rate ≤ 5%
3. **Threshold selection:** Use precision-recall curve to find optimal threshold — do not use 0.5 blindly
4. **Report honestly:** State dataset provenance, split method, and caveats in any presentation

#### Dead Model Cleanup

| Model File | Size | Recommendation |
|---|---|---|
| `model_baseline.joblib` | 12 KB | **DELETE** — never loaded, superseded by LightGBM |
| `model_enhanced.joblib` | 33 MB | **DELETE** — never loaded, wastes repo space |
| `model_scalable.joblib` | 643 KB | **DELETE** — never loaded |
| `vectorizer_baseline.joblib` | 13 KB | **DELETE** |
| `vectorizer_enhanced.joblib` | 396 B | **DELETE** |
| `vectorizer_scalable.joblib` | 786 KB | **DELETE** |

> **Action:** Delete all 6 dead model files. Keep only `phishing_lgbm.joblib` and `model_metadata.json`. After retraining, replace `phishing_lgbm.joblib` with the new model and update `model_metadata.json` with new features list and threshold.

---

## 2. Evidence Fusion Meta-Model

### 2.1 Purpose

Replace the hand-tuned weight blending currently in [`main.py` L521-533](../../../backend/main.py) with a trained stacked meta-classifier. Each investigation evidence signal becomes a feature; the meta-model produces a single calibrated phishing probability.

### 2.2 Architecture

```
Evidence Signals (from Investigation Agent)
    │
    ├── ml_url_score          (from Detection Engine)
    ├── dom_login_form        (from Investigation Agent)
    ├── dom_otp_field         (from Investigation Agent)
    ├── dom_card_field        (from Investigation Agent)
    ├── dom_pii_field         (from Investigation Agent)
    ├── urgency_language      (from Investigation Agent)
    ├── fear_language         (from Investigation Agent)
    ├── authority_language    (from Investigation Agent)
    ├── brand_impersonation   (from Investigation Agent)
    ├── domain_mismatch       (from Investigation Agent)
    ├── visual_similarity     (from Investigation Agent — Upgrade)
    ├── redirect_chain_depth  (from Investigation Agent)
    ├── external_submission   (from Investigation Agent)
    ├── threat_intel_match    (from Threat Intel — Upgrade)
    │
    ▼
┌──────────────────────┐
│  Evidence Fusion     │
│  (Logistic Regression│
│   or LightGBM)       │
└──────┬───────────────┘
       │
       ▼
  P(phishing | evidence) = σ(w₀ + w₁·S₁ + w₂·S₂ + ... + wₙ·Sₙ)
```

### 2.3 Signal Catalog

This is the canonical list of all evidence signals. The Investigation Agent PRD must produce signals with these exact names.

| Signal Name | Type | Range | Source | Description |
|---|---|---|---|---|
| `ml_url_score` | float | 0.0–1.0 | Detection Engine | LightGBM URL classifier probability |
| `dom_login_form` | float | 0.0–1.0 | Investigation Agent | Confidence that a login form (username + password) exists |
| `dom_otp_field` | float | 0.0–1.0 | Investigation Agent | Confidence that an OTP/2FA input field exists |
| `dom_card_field` | float | 0.0–1.0 | Investigation Agent | Confidence that credit/debit card input fields exist |
| `dom_pii_field` | float | 0.0–1.0 | Investigation Agent | Confidence that PII fields exist (Aadhaar, PAN, SSN) |
| `urgency_language` | float | 0.0–1.0 | Investigation Agent | Score for urgency patterns ("act now", "expires today") |
| `fear_language` | float | 0.0–1.0 | Investigation Agent | Score for fear patterns ("blocked", "suspended", "unauthorized") |
| `authority_language` | float | 0.0–1.0 | Investigation Agent | Score for authority patterns ("official", "mandatory", "compliance") |
| `brand_impersonation` | float | 0.0–1.0 | Investigation Agent | Confidence that page claims to be a brand that doesn't match the domain |
| `domain_mismatch` | float | 0.0–1.0 | Investigation Agent | Score for domain vs claimed organization mismatch |
| `visual_similarity` | float | 0.0–1.0 | Investigation Agent | Cosine similarity between page screenshot embedding and trusted brand reference (Upgrade) |
| `redirect_chain_depth` | float | 0.0–1.0 | Investigation Agent | Normalized redirect chain length (deeper = more suspicious) |
| `external_submission` | float | 0.0–1.0 | Investigation Agent | Confidence that form submits to a domain different from the page domain |
| `threat_intel_match` | float | 0.0–1.0 | Threat Intel | Whether URL/domain appears in known phishing feeds (Upgrade) |

### 2.4 Training Strategy

**Challenge:** We don't have labeled investigation-level data yet (since the investigation system doesn't exist).

**Solution — Bootstrap approach:**
1. **Phase 1 (hackathon):** Train on the controlled benchmark scenarios (see §6). Create 50–100 labeled investigation scenarios across the phishing clone test pages and legitimate sites. Use these to train a simple logistic regression meta-model.
2. **Phase 2 (post-hackathon):** As the system runs and collects real investigation data with human feedback, retrain with a gradient-boosted meta-model on the larger dataset.
3. **Fallback:** If insufficient training data exists at demo time, use a calibrated weighted average with the following default weights (derived from cybersecurity literature on phishing indicators):

```python
DEFAULT_WEIGHTS = {
    'domain_mismatch':       0.20,
    'brand_impersonation':   0.18,
    'dom_login_form':        0.15,
    'ml_url_score':          0.12,
    'external_submission':   0.10,
    'urgency_language':      0.08,
    'dom_otp_field':         0.05,
    'dom_card_field':        0.04,
    'fear_language':         0.03,
    'authority_language':    0.02,
    'visual_similarity':     0.02,
    'redirect_chain_depth':  0.01,
    'dom_pii_field':         0.00,  # rare signal
    'threat_intel_match':    0.00   # upgrade feature
}
```

> These weights are a starting point only. The trained model's learned weights will replace them.

### 2.5 Output Schema

The Evidence Fusion output must conform exactly to the `EvidenceFusionResult` schema defined in [System Design §3.5](../02-system-design.md#35-investigation-agent--evidence-fusion-evidence-signals).

### 2.6 Module Location

```
backend/
├── detection/
│   ├── __init__.py
│   ├── url_model.py          ← LightGBM inference (extract from main.py L141-228)
│   ├── heuristics.py         ← URL heuristic checks (extract from main.py L494-507)
│   ├── evidence_fusion.py    ← NEW: stacked meta-model
│   └── feature_engineering.py ← NEW: extended feature extraction (35 features)
```

---

## 3. Threat Reasoner

### 3.1 Purpose

Transform the numeric `EvidenceFusionResult` into a human-readable `Verdict` object. This is what the user actually sees — it must be clear, accurate, and non-technical.

### 3.2 Architecture

The Threat Reasoner is NOT an LLM freestyle response. It uses a **template-based approach with LLM polish:**

1. **Step 1: Determine verdict label** — Based on `phishing_probability`:
   - `>= 0.80` → `PHISHING`
   - `>= 0.50` → `SUSPICIOUS`
   - `>= 0.20` → `LEGITIMATE` (with caveats)
   - `< 0.20` → `LEGITIMATE`
   - If evidence is contradictory (high visual similarity but legitimate domain) → `INCONCLUSIVE`

2. **Step 2: Determine attack type** — Based on which signals are highest:
   - `dom_login_form` + `brand_impersonation` high → `credential_phishing`
   - `dom_card_field` + `brand_impersonation` high → `payment_phishing`
   - `brand_impersonation` high alone → `brand_impersonation`
   - `redirect_chain_depth` high → `redirect_attack`
   - `urgency_language` + `fear_language` high → `social_engineering`

3. **Step 3: Generate explanation** — Template-based with the top 3-5 evidence signals filled in:

```python
EXPLANATION_TEMPLATE = """
This site is {verdict_action} {claimed_org}. {evidence_summary}
Verdict: {probability_pct}% likely {attack_type_readable}.
"""

# Example output:
# "This site is impersonating State Bank of India. The login page closely
#  matches the real SBI portal but is hosted on a different domain
#  (sbi-login-verify.example.com instead of onlinesbi.sbi.co.in).
#  A password and OTP field were detected. The form submits data to a
#  suspicious external endpoint.
#  Verdict: 96% likely credential phishing."
```

4. **Step 4 (optional): LLM polish** — If Gemini is available and the explanation is complex, pass the template output through Gemini for natural language smoothing. The template output is always the fallback.

### 3.3 Explanation Rules

1. **Use the organization's actual name**, not domain names, in the user-facing explanation
2. **Lead with the most important evidence** (highest-weight signal from Evidence Fusion)
3. **State the mismatch concretely:** "hosted on X instead of Y" — not vague "suspicious domain"
4. **Never use technical jargon** in user-facing explanations: no "DOM", no "entropy", no "cosine similarity"
5. **Keep it to 2-4 sentences maximum**
6. **Include the percentage** — users understand "96% likely phishing" better than abstract labels

### 3.4 Module Location

```
backend/
├── detection/
│   ├── threat_reasoner.py    ← NEW: verdict generation
│   └── explanation_templates/ ← NEW: template strings per attack type
```

---

## 4. Social Engineering / Language Analysis

### 4.1 Current State

The extension has client-side trigger pattern matching ([`service-worker.js` L240-258](../../../extension-clean/src/background/service-worker.js)). The backend endpoint `/api/v1/temporal/analyze` that the extension tries to call **does not exist** — it falls back to `/detect`.

### 4.2 Target State

Move language analysis to the backend as a proper module. The Investigation Agent calls this module during investigation to produce `urgency_language`, `fear_language`, and `authority_language` evidence signals.

### 4.3 Pattern Categories

| Category | Enum Value | Patterns |
|---|---|---|
| **Urgency** | `urgency_language` | "immediately", "urgent", "now", "asap", "hurry", "quick", "expire", "expiring", "deadline", "limited time", "act now", "don't wait", "within 24 hours", "last chance" |
| **Fear** | `fear_language` | "locked", "suspended", "terminated", "blocked", "compromised", "unauthorized", "suspicious activity", "fraud", "security alert", "breach", "will be deleted", "permanently", "legal action" |
| **Authority** | `authority_language` | "verify", "confirm", "update required", "mandatory", "compliance", "official notice", "authorized", "government", "RBI directive", "regulatory" |
| **Reward** | (contributes to `urgency_language`) | "you've won", "congratulations", "prize", "cashback", "guaranteed returns", "free" |
| **Scarcity** | (contributes to `urgency_language`) | "only X left", "limited slots", "seats remaining", "offer expires" |

### 4.4 Scoring

For each category, score = `(matched_patterns / total_patterns_in_category)` weighted by pattern strength. Stronger patterns (e.g., "legal action") have a weight of 1.5; weaker patterns (e.g., "now") have a weight of 0.5 to avoid false positives on legitimate urgent content.

### 4.5 Module Location

```
backend/
├── detection/
│   ├── language_analysis.py  ← NEW: social engineering pattern detection
```

---

## 5. Visual / Logo Similarity (Upgrade Feature)

### 5.1 Approach

**This is an Upgrade feature — build only if Core is complete.**

1. **Screenshot capture:** The Investigation Agent takes a screenshot of the suspicious page using Playwright
2. **Embedding generation:** Pass the screenshot through a lightweight vision model to generate an embedding vector. Options:
   - CLIP (ViT-B/32) — pre-trained, good at visual similarity, ~150MB
   - Perceptual hashing (pHash) — no ML model needed, faster, less accurate
   - **Recommended for hackathon:** pHash for speed, with CLIP as a stretch goal
3. **Comparison:** Compute cosine similarity between the suspicious page embedding and a reference set of trusted brand login page screenshots
4. **Signal output:** The `visual_similarity` evidence signal = max cosine similarity to any trusted brand screenshot

### 5.2 Reference Set

Store 1-2 reference screenshots per organization in the Trusted Source Registry. For the hackathon, capture screenshots of the login pages for the 20-50 organizations in the seed list.

### 5.3 Key Principle

Visual similarity alone is NOT sufficient evidence. It must be combined with `domain_mismatch` to be meaningful:
- High visual similarity + domain matches → LEGITIMATE (it looks like the real thing because it IS the real thing)
- High visual similarity + domain mismatch → STRONG phishing evidence (cloned look, wrong address)
- Low visual similarity + domain mismatch → Could be anything, not conclusive

### 5.4 Module Location

```
backend/
├── detection/
│   ├── visual/
│   │   ├── __init__.py
│   │   ├── screenshot_embed.py   ← embedding generation
│   │   ├── similarity.py         ← cosine similarity comparison
│   │   └── references/           ← trusted brand screenshots (gitignored, generated)
```

---

## 6. Test / Acceptance Checklist

### Detection Engine (retrained LightGBM)

- [ ] Model retrained with domain-level split
- [ ] Class imbalance handled via `scale_pos_weight`
- [ ] All 35 features implemented and documented
- [ ] AUC-ROC ≥ 0.98 on domain-split test set
- [ ] False positive rate ≤ 5% on Tranco top 1K domains
- [ ] Threshold selected via precision-recall curve analysis
- [ ] `model_metadata.json` updated with new features list and threshold
- [ ] Dead models deleted from `models/` directory

### Evidence Fusion

- [ ] Meta-model accepts all 14 signals from the Signal Catalog (§2.3)
- [ ] Output conforms to `EvidenceFusionResult` schema ([System Design §3.5](../02-system-design.md#35-investigation-agent--evidence-fusion-evidence-signals))
- [ ] Feature importances are returned for explainability
- [ ] Fallback to default weights works when model is not trained
- [ ] Handles missing signals gracefully (uses 0.0 for missing)

### Threat Reasoner

- [ ] Output conforms to `Verdict` schema ([System Design §3.6](../02-system-design.md#36-evidence-fusion--threat-reasoner-verdict-generation))
- [ ] Explanation is ≤ 4 sentences, uses no technical jargon
- [ ] Explanation includes organization name, not just domain
- [ ] Attack type is correctly determined from signal pattern
- [ ] Probability percentage is included
- [ ] Template fallback works when LLM is unavailable

### Language Analysis

- [ ] All pattern categories produce scores in 0.0–1.0 range
- [ ] No false positives on legitimate urgent content (e.g., real bank security emails)
- [ ] Patterns cover India-specific scam language (KYC, Aadhaar, UPI)

### Visual Similarity (Upgrade)

- [ ] Reference screenshots captured for ≥ 20 organizations
- [ ] Cosine similarity correctly identifies cloned pages
- [ ] Does NOT flag legitimate pages as visually similar to themselves (domain check required)

---

## 7. Dependencies on Other Sub-PRDs

| Dependency | Sub-PRD | What This PRD Needs From It |
|---|---|---|
| Investigation Agent | [03e](./03e-investigation-agent.md) | Collects evidence signals and passes them to Evidence Fusion. Must produce signals with exact names from §2.3. |
| Backend API | [03b](./03b-backend-api.md) | Hosts the `/api/v1/detect` endpoint that invokes the Detection Engine. Must route investigation triggers to the Investigation Orchestrator. |
| Dashboard | [03d](./03d-dashboard-ui.md) | Displays the Verdict object's explanation and evidence list. Must render the evidence graph. |

## 8. What Breaks If This Contract Changes

| If This Changes... | These Sub-PRDs Break |
|---|---|
| Signal names in §2.3 | Investigation Agent (produces signals), Dashboard (displays them) |
| `EvidenceFusionResult` schema | Investigation Agent (consumes it), Backend API (forwards it) |
| `Verdict` schema | Extension (renders it), Dashboard (renders it), Backend API (serves it) |
| `risk_level` enum values | Extension (badge colors), Dashboard (styling), Backend (DB schema) |
| Explanation template format | Extension blocked page, Dashboard incident view |

---

*Next: [Backend/API Core](./03b-backend-api.md)*
