# Step 0 — Codebase Scan & Delta List

> **Project:** ClickWise (formerly SecureSentinel)
> **Git:** https://github.com/karthik5033/ClickWise.git
> **Scanned:** 2026-08-17

---

## 1. Verified Directory Tree

```
ClickWise/
├── .env.local                  ← GEMINI_API_KEY (committed — security issue)
├── .gitignore                  ← lists .env.local but file is still tracked
├── Rulebook.txt                ← planning protocol
├── README.md                   ← 36 KB project description
├── present_state.md            ← 43 KB state doc (treat as claim, verified below)
├── issues.md                   ← 33 KB known issues
├── start_server_v3.py          ← uvicorn launcher, port 8002, host 0.0.0.0
├── run_backend.bat             ← batch launcher
│
├── backend/
│   ├── main.py                 ← 990 lines, monolithic FastAPI app
│   ├── requirements.txt        ← 11 deps (no pandas listed, but imported at runtime)
│   ├── sql_app.db              ← 1.3 MB (DUPLICATE #1)
│   ├── verify_module3.py
│   ├── app/
│   │   ├── __init__.py
│   │   ├── database.py         ← SQLAlchemy, points to app/sql_app.db
│   │   ├── models.py           ← ScanResult, BlockedDomain, AllowedDomain
│   │   ├── sql_app.db          ← 2.5 MB (DUPLICATE #2 — the one actually used)
│   │   └── services/
│   │       ├── __init__.py
│   │       └── llm.py          ← Gemini integration (sync time.sleep in async context)
│   └── scripts/
│       └── clear_data.py
│
├── extension-clean/            ← Chrome Extension MV3
│   ├── manifest.json           ← v3.0.0, name "SecureSentinel", port 8002
│   ├── popup.html / popup.js   ← Extension popup UI
│   ├── blocked.html/css/js     ← Block page
│   ├── icons/
│   └── src/
│       ├── background/
│       │   └── service-worker.js    ← 477 lines, API_BASE = 127.0.0.1:8002
│       └── content/
│           ├── content.js           ← Link scanner, risk popup badges
│           ├── dialog-interceptor.js ← Intercepts alert/confirm/prompt
│           ├── dom-popup-scanner.js  ← Scans DOM for fake popups
│           └── ai-dlp.js            ← DLP for AI chat sites
│
├── my-app/                     ← Next.js + React + Tailwind dashboard
│   ├── app/
│   │   ├── dashboard/          ← Main dashboard route
│   │   │   ├── page.tsx        ← 20 KB, KPI dashboard
│   │   │   ├── activity/       ← Activity log sub-route
│   │   │   ├── controls/       ← Controls sub-route
│   │   │   └── privacy/        ← Privacy settings sub-route
│   │   ├── analyze/            ← URL analysis page
│   │   ├── blocked/            ← Blocked domains page
│   │   └── ... (architecture, docs, features, login, test, etc.)
│   └── components/
│       ├── dashboard/          ← Dashboard-specific components
│       ├── ai/                 ← AI chat component (Sentinel AI)
│       ├── landing/            ← Landing page components
│       ├── features/
│       └── ui/
│
├── models/
│   ├── phishing_lgbm.joblib    ← 6.8 MB — ACTIVE (loaded by main.py)
│   ├── model_metadata.json     ← 29 features, threshold=0.767, AUC=0.993
│   ├── model_baseline.joblib   ← 12 KB — DEAD (never loaded)
│   ├── model_enhanced.joblib   ← 33 MB — DEAD (never loaded)
│   ├── model_scalable.joblib   ← 643 KB — DEAD (never loaded)
│   ├── vectorizer_baseline.joblib  ← DEAD
│   ├── vectorizer_enhanced.joblib  ← DEAD
│   └── vectorizer_scalable.joblib  ← DEAD
│
├── ext_data/                   ← Training datasets + Tranco top 10K
├── data/                       ← raw/ and processed/ (empty or gitignored)
├── scripts/                    ← 17 training/evaluation/data-gen scripts
├── notebooks/                  ← 4 Jupyter notebooks (explore, preprocess, train, evaluate)
└── sih_plan/                   ← Source docs for the new system
    ├── idea.md
    ├── idea_v1.txt
    └── SecureSentinel_Project_Proposal.pdf
```

---

## 2. Verified Entrypoints & Ports

| Component | Entrypoint | Port | Evidence |
|---|---|---|---|
| Backend (actual) | [`start_server_v3.py`](file:///d:/coding_files/ClickWise/start_server_v3.py) L13 | **8002** | `uvicorn.run("backend.main:app", port=8002)` |
| Backend (`__main__`) | [`main.py`](file:///d:/coding_files/ClickWise/backend/main.py) L989 | **8000** | `uvicorn.run(app, port=8000)` ← **MISMATCH** |
| Extension | [`manifest.json`](file:///d:/coding_files/ClickWise/extension-clean/manifest.json) L12 | **8002** | `host_permissions: "http://127.0.0.1:8002/*"` |
| Service Worker | [`service-worker.js`](file:///d:/coding_files/ClickWise/extension-clean/src/background/service-worker.js) L6 | **8002** | `API_BASE = "http://127.0.0.1:8002/api/v1"` |
| Dashboard (Next.js) | `my-app/` | **3000** (default) | Standard Next.js |

> [!WARNING]
> **Port mismatch:** `main.py __main__` starts on 8000, but `start_server_v3.py` and the extension both expect 8002. Running `python backend/main.py` directly will silently fail to connect to the extension.

---

## 3. Confirmed Live Endpoints (main.py)

| Route | Method | Line | Status |
|---|---|---|---|
| `/api/v1/detect` | POST | [L264](file:///d:/coding_files/ClickWise/backend/main.py#L264) | ✅ LIVE — core detection |
| `/api/v1/blocklist` | GET | [L652](file:///d:/coding_files/ClickWise/backend/main.py#L652) | ✅ LIVE |
| `/api/v1/activity` | GET | [L676](file:///d:/coding_files/ClickWise/backend/main.py#L676) | ✅ LIVE |
| `/api/v1/block` | POST | [L704](file:///d:/coding_files/ClickWise/backend/main.py#L704) | ✅ LIVE |
| `/api/v1/unblock` | POST | [L720](file:///d:/coding_files/ClickWise/backend/main.py#L720) | ✅ LIVE |
| `/api/v1/privacy/settings` | GET | [L746](file:///d:/coding_files/ClickWise/backend/main.py#L746) | ✅ LIVE |
| `/api/v1/privacy/settings` | POST | [L750, L773](file:///d:/coding_files/ClickWise/backend/main.py#L750) | ⚠️ **TRIPLE-DEFINED** (L750 stub, L764 backup alias, L773 actual) |
| `/api/v1/reset` | DELETE | [L782](file:///d:/coding_files/ClickWise/backend/main.py#L782) | ⚠️ LIVE — **unauthenticated** delete-all |
| `/api/v1/analyze` | POST | [L793](file:///d:/coding_files/ClickWise/backend/main.py#L793) | ⚠️ **STUB** — returns `{max_risk_score: 0.0}` always |
| `/api/v1/chat` | POST | [L812](file:///d:/coding_files/ClickWise/backend/main.py#L812) | ✅ LIVE — Gemini chat |
| `/api/v1/neural/scan` | POST | [L830](file:///d:/coding_files/ClickWise/backend/main.py#L830) | ✅ LIVE — Gemini URL analysis |
| `/api/v1/dashboard` | GET | [L863](file:///d:/coding_files/ClickWise/backend/main.py#L863) | ✅ LIVE |
| `/api/v1/stats/summary` | GET | [L928](file:///d:/coding_files/ClickWise/backend/main.py#L928) | ✅ LIVE |
| `/api/v1/status/current-url` | POST/GET | [L974, L980](file:///d:/coding_files/ClickWise/backend/main.py#L974) | ✅ LIVE |
| `/health` | GET | [L983](file:///d:/coding_files/ClickWise/backend/main.py#L983) | ✅ LIVE |
| `/api/v1/temporal/analyze` | — | — | ❌ **DOES NOT EXIST** — extension calls it ([service-worker.js L197](file:///d:/coding_files/ClickWise/extension-clean/src/background/service-worker.js#L197)), falls back to `/detect` |

---

## 4. Confirmed Dead Code

| Item | Location | Evidence |
|---|---|---|
| `model_baseline.joblib` | `models/` | Never loaded — no code references it |
| `model_enhanced.joblib` (33 MB) | `models/` | Never loaded |
| `model_scalable.joblib` | `models/` | Never loaded |
| All 3 vectorizers | `models/` | Never loaded |
| Router import (temporal) | [main.py L826-828](file:///d:/coding_files/ClickWise/backend/main.py#L826-L828) | Commented out: `# from app.routes import temporal` |
| `verify_module3.py` | `backend/` | Standalone verification script |
| 17 training scripts | `scripts/` | Used for training, not runtime |

---

## 5. Security Issues Found

| Issue | Severity | Location |
|---|---|---|
| **API key committed to repo** | 🔴 CRITICAL | [`.env.local`](file:///d:/coding_files/ClickWise/.env.local) L1 — Gemini key `AIzaSyCWW7...` in plaintext |
| **No auth on any endpoint** | 🔴 CRITICAL | All routes in `main.py` — no auth middleware |
| **Unauthenticated `/reset`** | 🔴 CRITICAL | [L782](file:///d:/coding_files/ClickWise/backend/main.py#L782) — deletes all scan data |
| **Open CORS (`*`)** | 🟡 HIGH | [L38](file:///d:/coding_files/ClickWise/backend/main.py#L38) — `allow_origins=["*"]` |
| **Server binds to 0.0.0.0** | 🟡 HIGH | [start_server_v3.py L13](file:///d:/coding_files/ClickWise/start_server_v3.py#L13) — exposes to network |
| **Sync `time.sleep` in async** | 🟡 MEDIUM | [llm.py L126](file:///d:/coding_files/ClickWise/backend/app/services/llm.py#L126) — blocks async event loop |

---

## 6. Architecture Debt

| Issue | Location | Impact |
|---|---|---|
| **Monolith main.py** (990 lines) | [`main.py`](file:///d:/coding_files/ClickWise/backend/main.py) | All routes, models, ML, heuristics in one file |
| **Duplicate SQLite DBs** | `backend/sql_app.db` (1.3MB) + `backend/app/sql_app.db` (2.5MB) | `database.py` points to `app/sql_app.db`; `backend/sql_app.db` is stale |
| **Triple-defined privacy endpoint** | L750, L764, L773 | Three POST handlers for same path |
| **Pandas imported per-call** | [L222](file:///d:/coding_files/ClickWise/backend/main.py#L222) | `import pandas as pd` inside `get_ml_score()` |
| **4-second blocklist polling** | [service-worker.js L130](file:///d:/coding_files/ClickWise/extension-clean/src/background/service-worker.js#L130) | `setInterval(syncBlocklist, 4 * 1000)` — excessive |
| **Content script scans all links** | [content.js](file:///d:/coding_files/ClickWise/extension-clean/src/content/content.js) | Every page, every link gets analyzed |
| **Variable shadowing** | [main.py L480-481](file:///d:/coding_files/ClickWise/backend/main.py#L480) | `for domain in BENIGN_DOMAINS` shadows outer `domain` variable |

---

## 7. Delta List: Source Docs vs Actual Code

This is the critical artifact. For every capability described in [`idea.md`](file:///d:/coding_files/ClickWise/sih_plan/idea.md) and [`idea_v1.txt`](file:///d:/coding_files/ClickWise/sih_plan/idea_v1.txt), I mark what exists.

### Core Pipeline

| # | Capability | Status | Evidence |
|---|---|---|---|
| 1 | **URL Detection (ML)** — LightGBM classifier | ✅ EXISTS | [`main.py` L94-228](file:///d:/coding_files/ClickWise/backend/main.py#L94) — loads `phishing_lgbm.joblib`, 29 features, threshold 0.767 |
| 2 | **URL Heuristics** — IP host, length, suspicious chars | ✅ EXISTS | [`main.py` L494-507](file:///d:/coding_files/ClickWise/backend/main.py#L494) |
| 3 | **LLM verification** — Gemini double-check for ambiguous URLs | ✅ EXISTS | [`main.py` L562-583](file:///d:/coding_files/ClickWise/backend/main.py#L562) + [`llm.py`](file:///d:/coding_files/ClickWise/backend/app/services/llm.py) |
| 4 | **Score blending** — ML + heuristic + LLM | ⚠️ PARTIALLY EXISTS | [`main.py` L521-533](file:///d:/coding_files/ClickWise/backend/main.py#L521) — hand-tuned weights, NOT a trained meta-model |
| 5 | **Keyword blocklist** — strict + suspicious keywords | ✅ EXISTS | [`main.py` L403-492](file:///d:/coding_files/ClickWise/backend/main.py#L403) |
| 6 | **Trusted domain whitelist** — Tranco 10K + hardcoded | ✅ EXISTS | [`main.py` L44-84, L116-139, L358-401](file:///d:/coding_files/ClickWise/backend/main.py#L44) |
| 7 | **Chrome Extension** — detect, block, popup, badges | ✅ EXISTS | [`extension-clean/`](file:///d:/coding_files/ClickWise/extension-clean) — full MV3 extension |
| 8 | **Block page** — redirect to blocked.html on high risk | ✅ EXISTS | [`blocked.html`](file:///d:/coding_files/ClickWise/extension-clean/blocked.html) + [service-worker.js L397-403](file:///d:/coding_files/ClickWise/extension-clean/src/background/service-worker.js#L397) |
| 9 | **Dashboard** — KPI stats, activity, privacy settings | ✅ EXISTS | [`my-app/app/dashboard/`](file:///d:/coding_files/ClickWise/my-app/app/dashboard) |
| 10 | **AI Chat (Sentinel AI)** — Gemini-powered Q&A | ✅ EXISTS | [`llm.py`](file:///d:/coding_files/ClickWise/backend/app/services/llm.py) + [`main.py` L812](file:///d:/coding_files/ClickWise/backend/main.py#L812) |

### New Automation Layer (from idea.md / idea_v1.txt)

| # | Capability | Status | Evidence |
|---|---|---|---|
| 11 | **Investigation Agent** — autonomous browser investigation | ❌ DOES NOT EXIST | No Playwright, no browser agent, no investigation logic anywhere in code |
| 12 | **Investigation Browser** — isolated Playwright context | ❌ DOES NOT EXIST | No browser automation dependency or code |
| 13 | **Trusted Reference Browser** — separate context for real sites | ❌ DOES NOT EXIST | |
| 14 | **Policy Engine** — deterministic safety layer, risk tier enforcement | ❌ DOES NOT EXIST | |
| 15 | **Action Risk Classification** (5-level: Observation→Financial) | ❌ DOES NOT EXIST | |
| 16 | **Agent State Machine** (OBSERVE→ASSESS→...→COMPLETE) | ❌ DOES NOT EXIST | |
| 17 | **Bounded Investigation Planner** (max steps/time/domains) | ❌ DOES NOT EXIST | |
| 18 | **Evidence Fusion meta-model** (stacked classifier) | ❌ DOES NOT EXIST | Current scoring is hand-tuned weight blending ([L521-533](file:///d:/coding_files/ClickWise/backend/main.py#L521)) |
| 19 | **Explainable Reasoning / Verdict** | ❌ DOES NOT EXIST | Current output is `risk_level: High/Medium/Low` — no human-readable verdict |
| 20 | **Intent Inference** — extract user's actual goal | ❌ DOES NOT EXIST | |
| 21 | **Correct Path Redirection** — redirect to real destination | ❌ DOES NOT EXIST | Current flow: detect → block. No redirect to legitimate site |
| 22 | **Trusted Source Registry** (org → official domains DB) | ❌ DOES NOT EXIST | `TRUSTED_DOMAINS` is a flat set of domains, not an org-to-service mapping |
| 23 | **Recovery Workflow Engine** | ❌ DOES NOT EXIST | |
| 24 | **Visual/Logo Similarity** — screenshot comparison | ❌ DOES NOT EXIST | |
| 25 | **Evidence Graph** — structured evidence relationships | ❌ DOES NOT EXIST | |
| 26 | **Attack Chain Reconstruction** | ❌ DOES NOT EXIST | |
| 27 | **Credential-Harvesting Detection** (form analysis) | ❌ DOES NOT EXIST | |
| 28 | **Social Engineering / Temporal Analysis** | ⚠️ PARTIALLY EXISTS | Extension has client-side trigger patterns ([service-worker.js L240-258](file:///d:/coding_files/ClickWise/extension-clean/src/background/service-worker.js#L240)), but backend `/temporal/analyze` endpoint **does not exist** — falls back to `/detect` |
| 29 | **Prompt Injection Defense** | ❌ DOES NOT EXIST | |
| 30 | **Incident Investigation Console** (dashboard upgrade) | ❌ DOES NOT EXIST | Current dashboard is KPI-only |
| 31 | **Agent Activity Trace / Observability** | ❌ DOES NOT EXIST | |
| 32 | **Human-in-the-Loop approval** for consequential actions | ❌ DOES NOT EXIST | |
| 33 | **Family Protection Notifications** | ❌ DOES NOT EXIST | |
| 34 | **Threat Intelligence Feed** (PhishTank, OpenPhish) | ❌ DOES NOT EXIST | |

### Peripheral Features (existing but noteworthy)

| # | Capability | Status | Evidence |
|---|---|---|---|
| 35 | **Dialog Interception** — catches JS alert/confirm/prompt | ✅ EXISTS | [`dialog-interceptor.js`](file:///d:/coding_files/ClickWise/extension-clean/src/content/dialog-interceptor.js) |
| 36 | **DOM Popup Scanner** — scans for fake DOM popups | ✅ EXISTS | [`dom-popup-scanner.js`](file:///d:/coding_files/ClickWise/extension-clean/src/content/dom-popup-scanner.js) |
| 37 | **AI DLP** — prevents PII leak to AI chat sites | ✅ EXISTS | [`ai-dlp.js`](file:///d:/coding_files/ClickWise/extension-clean/src/content/ai-dlp.js) |
| 38 | **Current URL Tracking** — backend knows user's current page | ✅ EXISTS | [L974-982](file:///d:/coding_files/ClickWise/backend/main.py#L974) |

---

## 8. Summary

**Existing system (what works today):** A Chrome extension that detects phishing URLs using a LightGBM model + heuristics + optional Gemini LLM check, blocks high-risk pages, and shows stats on a Next.js dashboard. The flow is: **Detect → Block**. That's it.

**What the source docs describe:** An autonomous investigation-and-correction system. The flow should be: **Detect → Investigate → Reason → Correct Path → Recover**. Everything from "Investigate" onwards (items 11-34 above) **does not exist in the codebase**.

**The gap is large.** Out of 34 capabilities documented in the source docs:
- **10 exist** (the current detection + extension + dashboard)
- **2 partially exist** (score blending is manual not ML, temporal analysis is client-only)
- **22 do not exist** (the entire autonomous investigation layer)

---

## 9. Assumptions Made (flagging for you)

1. **`backend/sql_app.db`** (1.3MB) appears to be stale — `database.py` points to `backend/app/sql_app.db` (2.5MB). I'm treating the `app/` one as the live DB.
2. The PDF proposal (`SecureSentinel_Project_Proposal.pdf`) was not read because it's binary — I'm relying on `idea.md` and `idea_v1.txt` which cover the same content in more detail.
3. The name "SecureSentinel" appears everywhere in the code (manifest, FastAPI title, service worker logs). Renaming to "ClickWise" will be needed across all files.
