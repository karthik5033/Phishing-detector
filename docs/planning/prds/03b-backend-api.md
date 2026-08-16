# Sub-PRD: Backend / API Core

> **Document:** `docs/planning/prds/03b-backend-api.md`
> **Owner:** Backend/Security Infrastructure Lead (Member 5)
> **Depends on:** [System Design](../02-system-design.md)
> **Status:** Sub-PRD — must not contradict System Design

---

## Contracts Consumed

| Contract | Source | Section |
|---|---|---|
| `DetectionResult` schema (request/response) | [System Design](../02-system-design.md#31-extension--backend-detection-request) | §3.1 |
| Investigation polling schema | [System Design](../02-system-design.md#32-extension--backend-investigation-polling) | §3.2 |
| `InvestigationObjective` schema | [System Design](../02-system-design.md#33-backend--investigation-agent-investigation-objective) | §3.3 |
| Communication pattern (polling, not WebSocket) | [System Design](../02-system-design.md#38-backend--extension-communication-pattern) | §3.8 |
| `investigation_status` enum | [System Design](../02-system-design.md#13-enums-and-status-values) | §1.3 |
| `risk_level` enum (`Low \| Medium \| High \| Critical`) | [System Design](../02-system-design.md#13-enums-and-status-values) | §1.3 |
| All data object schemas | [System Design](../02-system-design.md#12-data-objects) | §1.2 |

## Contracts Produced

| Contract | Consumers |
|---|---|
| All HTTP API endpoints (routes, request/response shapes) | [Extension](./03c-extension.md), [Dashboard](./03d-dashboard-ui.md) |
| Database schema (tables, columns, types) | All backend modules |
| Investigation Orchestrator interface | [Investigation Agent](./03e-investigation-agent.md), [Policy Engine](./03f-policy-engine.md) |

---

## Scope

### In Scope

1. De-monolith `main.py` (990 lines → modular structure)
2. Define and implement all new API routes for investigation lifecycle
3. Migrate from duplicate SQLite databases to a single database
4. Add basic authentication strategy
5. Fix existing bugs (stub endpoints, port mismatch, variable shadowing)
6. Define the Investigation Orchestrator (the component that coordinates investigation lifecycle)
7. New database tables for investigations, evidence, trusted sources

### Out of Scope

- ML model training/inference logic (see [Detection ML](./03a-detection-ml.md))
- Investigation Agent internals / Playwright (see [Investigation Agent](./03e-investigation-agent.md))
- Policy Engine internals (see [Policy Engine](./03f-policy-engine.md))
- Dashboard frontend (see [Dashboard](./03d-dashboard-ui.md))
- Extension frontend (see [Extension](./03c-extension.md))

---

## 1. De-Monolith Plan

### 1.1 Current Structure (single file)

[`backend/main.py`](../../../backend/main.py) currently contains everything:

| Lines | Content | Target Module |
|---|---|---|
| L1-26 | Imports + path hacking | Remove path hacks, use proper package |
| L27-42 | FastAPI app + CORS | `backend/main.py` (stays, but minimal) |
| L44-84 | `TRUSTED_DOMAINS` hardcoded set | → `backend/data/trusted_domains.py` |
| L86-139 | ML model loading + Tranco loading | → `backend/detection/url_model.py` |
| L141-228 | `extract_url_features()` + `get_ml_score()` | → `backend/detection/url_model.py` |
| L230-236 | `get_registered_domain()` | → `backend/detection/url_model.py` |
| L238-260 | Pydantic request/response models | → `backend/api/schemas.py` |
| L262-650 | `POST /api/v1/detect` (390 lines!) | → `backend/api/routes/detection.py` + `backend/detection/pipeline.py` |
| L652-702 | Blocklist + Activity endpoints | → `backend/api/routes/domains.py` |
| L704-736 | Block/Unblock endpoints | → `backend/api/routes/domains.py` |
| L738-780 | Privacy settings (triple-defined!) | → `backend/api/routes/settings.py` (single endpoint) |
| L782-791 | `DELETE /reset` | → `backend/api/routes/admin.py` (with auth) |
| L793-806 | `POST /analyze` (stub) | → Either implement or remove |
| L808-824 | `POST /chat` | → `backend/api/routes/chat.py` |
| L826-828 | Commented-out router import | → Delete |
| L830-857 | `POST /neural/scan` | → `backend/api/routes/detection.py` |
| L859-961 | Dashboard + stats endpoints | → `backend/api/routes/dashboard.py` |
| L963-985 | Current URL tracking + health check | → `backend/api/routes/status.py` |
| L987-990 | `__main__` uvicorn launcher | → Keep, but fix port to 8002 |

### 1.2 Target Structure

```
backend/
├── main.py                       ← Slim: FastAPI app init, CORS, router includes only (~50 lines)
├── requirements.txt              ← Updated with new dependencies
├── config.py                     ← NEW: configuration (ports, thresholds, feature flags)
│
├── api/
│   ├── __init__.py
│   ├── schemas.py                ← NEW: all Pydantic request/response models
│   ├── dependencies.py           ← NEW: FastAPI dependencies (auth, db session)
│   └── routes/
│       ├── __init__.py
│       ├── detection.py          ← POST /detect, POST /neural/scan
│       ├── investigation.py      ← NEW: POST /investigation/trigger, GET /investigation/{id}, GET /investigation/{id}/trace
│       ├── domains.py            ← GET /blocklist, GET /activity, POST /block, POST /unblock
│       ├── dashboard.py          ← GET /dashboard, GET /stats/summary
│       ├── settings.py           ← GET+POST /privacy/settings (ONE endpoint, not three)
│       ├── chat.py               ← POST /chat
│       ├── status.py             ← GET /health, GET+POST /status/current-url
│       └── admin.py              ← DELETE /reset (with auth gate)
│
├── detection/
│   ├── __init__.py
│   ├── pipeline.py               ← NEW: orchestrates detection flow (replaces main.py L262-650)
│   ├── url_model.py              ← Extracted: LightGBM loading + inference
│   ├── heuristics.py             ← Extracted: URL heuristic checks
│   ├── feature_engineering.py    ← NEW: extended 35-feature extraction
│   ├── evidence_fusion.py        ← NEW: stacked meta-model
│   ├── threat_reasoner.py        ← NEW: verdict generation
│   └── language_analysis.py      ← NEW: social engineering pattern detection
│
├── investigation/
│   ├── __init__.py
│   ├── orchestrator.py           ← NEW: investigation lifecycle manager
│   ├── agent.py                  ← NEW: Investigation Agent (see 03e PRD)
│   ├── browser/
│   │   ├── __init__.py
│   │   ├── sandbox.py            ← NEW: Playwright browser management
│   │   ├── tools.py              ← NEW: constrained tool interface
│   │   └── policies.py           ← NEW: Policy Engine (see 03f PRD)
│   └── evidence/
│       ├── __init__.py
│       └── collector.py          ← NEW: evidence signal collection
│
├── intent/
│   ├── __init__.py
│   ├── inference.py              ← NEW: intent extraction
│   └── correct_path.py           ← NEW: legitimate destination resolution
│
├── trusted_sources/
│   ├── __init__.py
│   ├── registry.py               ← NEW: Trusted Source Registry queries
│   └── seed_data.json            ← NEW: 30-40 org seed entries (see Kiro task)
│
├── recovery/
│   ├── __init__.py
│   └── workflows.py              ← NEW: structured recovery flows
│
├── app/
│   ├── __init__.py
│   ├── database.py               ← KEEP (fix path to single DB)
│   └── models.py                 ← EXTEND (add new tables)
│
├── services/
│   ├── __init__.py
│   └── llm.py                    ← KEEP (fix sync sleep, rename to ClickWise AI)
│
└── data/
    └── trusted_domains.py        ← Extracted: TRUSTED_DOMAINS + BENIGN_DOMAINS + keywords
```

### 1.3 Migration Strategy

**Do NOT rewrite everything at once.** Follow this order:

1. **Phase 1:** Create `api/schemas.py` and `config.py` — extract Pydantic models and constants
2. **Phase 2:** Create `api/routes/` — move each endpoint group into its own route file. Keep all business logic inline initially (just move code, don't refactor it)
3. **Phase 3:** Create `detection/` — extract ML and heuristic logic from the route handlers
4. **Phase 4:** Fix the triple-defined privacy endpoint (keep one), fix port mismatch, fix variable shadowing
5. **Phase 5:** Create `investigation/`, `intent/`, `trusted_sources/`, `recovery/` — these are NEW modules, built from scratch per their sub-PRDs
6. **Phase 6:** Update `main.py` to be a slim router-include file

**At each phase, the server must still start and all existing endpoints must still work.** Run `python start_server_v3.py` after each phase and verify with a curl to `/health`.

---

## 2. New API Routes

### 2.1 Investigation Routes

All investigation routes are NEW. They are defined here and consumed by the [Extension](./03c-extension.md) and [Dashboard](./03d-dashboard-ui.md).

#### `POST /api/v1/investigation/trigger`

Manually trigger an investigation (used by dashboard or extension when user requests deeper analysis).

```jsonc
// REQUEST
{
  "url": "https://sbi-login-verify.example.com/kyc",
  "context": {
    "referrer": "https://google.com/search?q=sbi+net+banking",
    "search_query": "sbi net banking",
    "message_text": null
  }
}

// RESPONSE
{
  "investigation_id": "inv_a1b2c3d4",
  "status": "PENDING",
  "poll_url": "/api/v1/investigation/inv_a1b2c3d4"
}
```

#### `GET /api/v1/investigation/{investigation_id}`

Poll investigation status. Schema exactly as defined in [System Design §3.2](../02-system-design.md#32-extension--backend-investigation-polling).

#### `GET /api/v1/investigation/{investigation_id}/trace`

Retrieve the full investigation trace (timestamped action log).

```jsonc
// RESPONSE
{
  "investigation_id": "inv_a1b2c3d4",
  "trace": [
    {
      "timestamp": "2026-08-17T01:15:00.100Z",
      "state": "OBSERVING",
      "action": "screenshot",
      "result": "captured",
      "duration_ms": 450
    },
    {
      "timestamp": "2026-08-17T01:15:00.600Z",
      "state": "OBSERVING",
      "action": "inspect_dom",
      "result": "login_form_detected",
      "duration_ms": 120
    },
    // ... more entries
  ]
}
```

#### `GET /api/v1/investigations`

List recent investigations (for dashboard).

```jsonc
// RESPONSE
{
  "investigations": [
    {
      "investigation_id": "inv_a1b2c3d4",
      "url": "https://sbi-login-verify.example.com/kyc",
      "status": "COMPLETE",
      "verdict_label": "PHISHING",
      "started_at": "2026-08-17T01:15:00Z",
      "elapsed_seconds": 12
    }
  ],
  "total": 1,
  "page": 1
}
```

### 2.2 Updated Detection Route

The existing `POST /api/v1/detect` is modified — NOT replaced. The response is extended with the `investigation` field as defined in [System Design §3.1](../02-system-design.md#31-extension--backend-detection-request).

**Investigation trigger logic** (inside the detection route):
```python
# After computing detection result...
investigation = None

if detection_result.confidence_score >= 0.60 and detection_result.confidence_score < 1.0:
    # Trigger investigation for suspicious-but-not-blocklisted URLs
    # Score >= 0.60 means suspicious enough to investigate
    # Score == 1.0 means blocklisted — no investigation needed, just block
    investigation = orchestrator.create_investigation(
        url=url,
        context=request.context,
        initial_detection=detection_result
    )

# Return extended response
return {
    **detection_result.dict(),
    "investigation": investigation  # null if not triggered
}
```

### 2.3 Endpoint Fixes

| Endpoint | Issue | Fix |
|---|---|---|
| `POST /api/v1/privacy/settings` | Triple-defined at L750, L764, L773 | **Delete L750 and L764.** Keep L773 (the one that reads query params). Move to `routes/settings.py`. |
| `POST /api/v1/analyze` | Stub — always returns `{max_risk_score: 0.0}` | **Implement** using language analysis module, or **remove** if not needed. Decision: implement it as a thin wrapper around `detection/language_analysis.py`. |
| `GET /api/v1/temporal/analyze` | Called by extension but doesn't exist | **Implement** in `routes/detection.py`. Route to `detection/language_analysis.py`. |
| `DELETE /api/v1/reset` | No authentication | Add API key check (see §4 Auth). |
| `__main__` block | Port 8000, conflicts with start_server_v3.py (port 8002) | Change to `port=8002`. |

### 2.4 Complete Route Table (post de-monolith)

| Route | Method | File | Status |
|---|---|---|---|
| `/health` | GET | `routes/status.py` | EXISTING — move |
| `/api/v1/detect` | POST | `routes/detection.py` | EXISTING — extend |
| `/api/v1/neural/scan` | POST | `routes/detection.py` | EXISTING — move |
| `/api/v1/temporal/analyze` | POST | `routes/detection.py` | **NEW** — implement |
| `/api/v1/analyze` | POST | `routes/detection.py` | EXISTING — implement properly |
| `/api/v1/investigation/trigger` | POST | `routes/investigation.py` | **NEW** |
| `/api/v1/investigation/{id}` | GET | `routes/investigation.py` | **NEW** |
| `/api/v1/investigation/{id}/trace` | GET | `routes/investigation.py` | **NEW** |
| `/api/v1/investigations` | GET | `routes/investigation.py` | **NEW** |
| `/api/v1/blocklist` | GET | `routes/domains.py` | EXISTING — move |
| `/api/v1/activity` | GET | `routes/domains.py` | EXISTING — move |
| `/api/v1/block` | POST | `routes/domains.py` | EXISTING — move |
| `/api/v1/unblock` | POST | `routes/domains.py` | EXISTING — move |
| `/api/v1/dashboard` | GET | `routes/dashboard.py` | EXISTING — move |
| `/api/v1/stats/summary` | GET | `routes/dashboard.py` | EXISTING — move |
| `/api/v1/privacy/settings` | GET+POST | `routes/settings.py` | EXISTING — fix (single endpoint) |
| `/api/v1/chat` | POST | `routes/chat.py` | EXISTING — move |
| `/api/v1/status/current-url` | GET+POST | `routes/status.py` | EXISTING — move |
| `/api/v1/reset` | DELETE | `routes/admin.py` | EXISTING — add auth |

**Total:** 19 routes (12 existing + 4 new + 3 fixed/implemented)

---

## 3. Database Migration

### 3.1 Current Problem

Two SQLite databases exist:
- `backend/sql_app.db` (1.3 MB) — **stale**, not used by the running app
- `backend/app/sql_app.db` (2.5 MB) — **active**, referenced by `database.py`

### 3.2 Fix

1. **Delete** `backend/sql_app.db` (the stale one)
2. **Keep** `backend/app/sql_app.db` as the single source of truth
3. **Update** `database.py` path to be explicit: `DB_PATH = os.path.join(os.path.dirname(__file__), "sql_app.db")` (already correct)
4. Add `sql_app.db` to `.gitignore` (already listed, but verify it's actually ignored)

### 3.3 New Tables

Add these tables to [`backend/app/models.py`](../../../backend/app/models.py):

```python
class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(String, primary_key=True, index=True)        # "inv_a1b2c3d4"
    url = Column(String, index=True)
    domain = Column(String, index=True)
    status = Column(String, index=True)                       # investigation_status enum
    verdict_label = Column(String, nullable=True)             # verdict_label enum
    verdict_probability = Column(Float, nullable=True)
    verdict_explanation = Column(String, nullable=True)
    correct_path_url = Column(String, nullable=True)
    correct_path_org = Column(String, nullable=True)
    exposure_type = Column(String, default="NONE")            # exposure_type enum
    initial_risk_score = Column(Float)
    user_context_json = Column(String, nullable=True)         # JSON string
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    elapsed_seconds = Column(Float, nullable=True)
    steps_completed = Column(Integer, default=0)
    steps_total = Column(Integer, nullable=True)


class InvestigationTraceEntry(Base):
    __tablename__ = "investigation_traces"

    id = Column(Integer, primary_key=True, autoincrement=True)
    investigation_id = Column(String, index=True)             # FK to investigations.id
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    state = Column(String)                                     # investigation_status enum
    action = Column(String)                                    # tool name or state transition
    result = Column(String, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    details_json = Column(String, nullable=True)               # JSON string for extra data


class EvidenceRecord(Base):
    __tablename__ = "evidence_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    investigation_id = Column(String, index=True)              # FK to investigations.id
    signal_name = Column(String)                               # from Signal Catalog (03a §2.3)
    score = Column(Float)
    confidence = Column(Float)
    source_module = Column(String)
    detail = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


class TrustedOrganization(Base):
    __tablename__ = "trusted_organizations"

    id = Column(String, primary_key=True)
    name = Column(String, index=True)
    category = Column(String, index=True)                      # banking, government, payment, etc.
    official_domains_json = Column(String)                     # JSON array of strings
    official_login_urls_json = Column(String)                  # JSON array of strings
    known_services_json = Column(String)                       # JSON array of strings
    logo_reference = Column(String, nullable=True)             # file path or null
    verification_source = Column(String)
    last_verified = Column(DateTime(timezone=True), nullable=True)
```

### 3.4 Migration Script

Create `backend/scripts/migrate_db.py`:

```python
"""
Run once after adding new models:
    python -m backend.scripts.migrate_db

Uses SQLAlchemy create_all — safe to re-run (won't drop existing tables).
"""
from backend.app.database import engine, Base
from backend.app import models  # triggers model registration

def migrate():
    Base.metadata.create_all(bind=engine)
    print("Database migration complete. All tables created/verified.")

if __name__ == "__main__":
    migrate()
```

---

## 4. Authentication Strategy

### 4.1 Current State

**No authentication on any endpoint.** Anyone who can reach the server can:
- Read all scan history (`GET /activity`)
- Delete all data (`DELETE /reset`)
- Block/unblock domains
- Read the user's current URL

### 4.2 Hackathon-Appropriate Solution

Full OAuth/JWT is overkill for a hackathon demo. Instead, implement **API key authentication** for sensitive endpoints:

```python
# backend/api/dependencies.py

from fastapi import Header, HTTPException
from backend.config import ADMIN_API_KEY

async def require_admin_key(x_api_key: str = Header(None)):
    """Gate for destructive/admin endpoints."""
    if not ADMIN_API_KEY:
        return  # No key configured = open access (dev mode)
    if x_api_key != ADMIN_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")
```

```python
# backend/config.py
import os
ADMIN_API_KEY = os.getenv("CLICKWISE_ADMIN_KEY", None)
```

### 4.3 Endpoint Protection Matrix

| Endpoint | Protection | Rationale |
|---|---|---|
| `POST /api/v1/detect` | None | Extension calls this on every navigation — auth would break it |
| `GET /api/v1/investigation/{id}` | None | Extension polls this — must be frictionless |
| `GET /api/v1/blocklist` | None | Extension syncs this every few seconds |
| `GET /api/v1/activity` | None | Read-only, low sensitivity |
| `GET /api/v1/dashboard` | None | Read-only |
| `POST /api/v1/block` | None | User-initiated action from extension popup |
| `POST /api/v1/unblock` | None | User-initiated action |
| `DELETE /api/v1/reset` | **`require_admin_key`** | Destructive — deletes all data |
| `GET+POST /api/v1/privacy/settings` | None | User settings, not sensitive |
| `POST /api/v1/chat` | None | Chat is user-facing |

> **Note:** For the hackathon, CORS stays as `allow_origins=["*"]`. In production, restrict to the extension origin and dashboard origin. Document this in [Fix List](../04-fix-list.md) as a post-hackathon improvement.

---

## 5. Investigation Orchestrator

### 5.1 Purpose

The Investigation Orchestrator is the backend component that manages the investigation lifecycle. It creates investigations, coordinates the Investigation Agent, tracks state transitions, stores results, and serves them via the API.

### 5.2 Interface

```python
# backend/investigation/orchestrator.py

class InvestigationOrchestrator:

    async def create_investigation(
        self,
        url: str,
        context: dict | None,
        initial_detection: DetectionResult
    ) -> dict:
        """
        Creates a new investigation and starts it in the background.
        Returns the investigation stub (id, status, poll_url).
        """

    async def get_investigation(self, investigation_id: str) -> dict:
        """
        Returns current investigation status + verdict if complete.
        """

    async def get_investigation_trace(self, investigation_id: str) -> dict:
        """
        Returns the full timestamped action trace.
        """

    async def list_investigations(self, page: int = 1, limit: int = 20) -> dict:
        """
        Lists recent investigations with pagination.
        """

    async def _run_investigation(self, investigation_id: str):
        """
        Internal: runs the investigation pipeline in a background task.
        State machine transitions happen here.
        Called via asyncio.create_task() from create_investigation().
        """
```

### 5.3 Background Execution

Investigations must NOT block the API response. When `create_investigation()` is called:

1. Create the `Investigation` DB row with `status=PENDING`
2. Return immediately with the investigation stub
3. Start `_run_investigation()` as an `asyncio` background task
4. The background task drives the state machine (PENDING → OBSERVING → ... → COMPLETE)
5. Each state transition updates the DB row
6. The extension polls `GET /investigation/{id}` to observe progress

```python
import asyncio

async def create_investigation(self, url, context, initial_detection):
    inv_id = f"inv_{generate_short_id()}"

    # Create DB record
    investigation = Investigation(
        id=inv_id,
        url=url,
        status="PENDING",
        initial_risk_score=initial_detection.confidence_score,
        # ...
    )
    db.add(investigation)
    db.commit()

    # Start background task (non-blocking)
    asyncio.create_task(self._run_investigation(inv_id))

    return {
        "investigation_id": inv_id,
        "status": "PENDING",
        "poll_url": f"/api/v1/investigation/{inv_id}"
    }
```

---

## 6. Configuration

### 6.1 `backend/config.py`

Centralize all configurable values that are currently hardcoded throughout `main.py`:

```python
import os

# Server
SERVER_PORT = int(os.getenv("CLICKWISE_PORT", "8002"))
SERVER_HOST = os.getenv("CLICKWISE_HOST", "127.0.0.1")  # NOT 0.0.0.0

# Detection
DETECTION_THRESHOLD_BLOCK = 0.75          # score >= this → block page
DETECTION_THRESHOLD_WARN = 0.55           # score >= this → yellow warning
DETECTION_THRESHOLD_INVESTIGATE = 0.60    # score >= this → trigger investigation
ML_MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'phishing_lgbm.joblib')
ML_METADATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'model_metadata.json')

# Investigation
INVESTIGATION_MAX_STEPS = 15
INVESTIGATION_MAX_TIME_SECONDS = 30
INVESTIGATION_MAX_BROWSER_CONTEXTS = 2
INVESTIGATION_POLLING_INTERVAL_HINT_MS = 2000

# Correct Path
CORRECT_PATH_AUTO_REDIRECT_THRESHOLD = 0.80
CORRECT_PATH_ASK_USER_THRESHOLD = 0.50

# Auth
ADMIN_API_KEY = os.getenv("CLICKWISE_ADMIN_KEY", None)

# LLM
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", None)

# Privacy
DEFAULT_RETENTION_DAYS = 30
DEFAULT_PII_MASKING = True
```

### 6.2 Environment Variables

Update `.env.local` (and create `.env.example`):

```bash
# .env.example
GEMINI_API_KEY=your_gemini_api_key_here
CLICKWISE_ADMIN_KEY=your_admin_key_here
CLICKWISE_PORT=8002
CLICKWISE_HOST=127.0.0.1
```

> **Critical:** Rotate the currently committed Gemini API key immediately. It's been exposed in the git history.

---

## 7. CORS Fix

### 7.1 Current

```python
allow_origins=["*"]  # main.py L38
```

### 7.2 Hackathon Fix

```python
allow_origins=[
    "chrome-extension://*",           # Chrome extension
    "http://localhost:3000",           # Dashboard (Next.js dev)
    "http://127.0.0.1:3000",
    "http://localhost:8002",           # Backend self-reference
]
```

### 7.3 Rationale

Full wildcard CORS means any website can call the backend API. While low-risk for a hackathon, restricting to known origins is easy and makes a better security story for judges.

---

## 8. `requirements.txt` Update

```
# Existing
fastapi
uvicorn
scikit-learn
joblib
numpy
sqlalchemy
pydantic
google-generativeai
python-dotenv
tldextract
lightgbm
pandas              # was missing — imported at runtime in get_ml_score()

# New
playwright          # Investigation Agent browser automation
asyncio             # built-in, but document the dependency
aiofiles            # async file I/O for evidence storage
python-Levenshtein  # typosquatting distance feature
imagehash           # perceptual image hashing (Upgrade: visual similarity)
Pillow              # image processing for screenshots
```

---

## 9. Test / Acceptance Checklist

### De-Monolith

- [ ] `main.py` is ≤ 60 lines (imports + app init + router includes + `__main__`)
- [ ] All 19 routes work identically to before (verified via curl/Postman)
- [ ] Server starts on port 8002 from both `start_server_v3.py` and `python -m backend.main`
- [ ] `__main__` block uses port 8002 (not 8000)
- [ ] Triple-defined privacy endpoint reduced to one
- [ ] Commented-out router import deleted

### New Routes

- [ ] `POST /investigation/trigger` creates investigation and returns stub
- [ ] `GET /investigation/{id}` returns current status during investigation
- [ ] `GET /investigation/{id}` returns full verdict + correct path when complete
- [ ] `GET /investigation/{id}/trace` returns timestamped action log
- [ ] `GET /investigations` returns paginated list
- [ ] Investigation runs in background (API response is immediate, ≤ 200ms)

### Database

- [ ] Stale `backend/sql_app.db` deleted
- [ ] Single DB at `backend/app/sql_app.db`
- [ ] New tables created via migration script
- [ ] Existing `ScanResult`, `BlockedDomain`, `AllowedDomain` tables untouched
- [ ] `Investigation`, `InvestigationTraceEntry`, `EvidenceRecord`, `TrustedOrganization` tables created

### Auth

- [ ] `DELETE /reset` requires `X-Api-Key` header when `CLICKWISE_ADMIN_KEY` is set
- [ ] `DELETE /reset` is open when `CLICKWISE_ADMIN_KEY` is not set (dev mode)
- [ ] Extension-facing endpoints work without auth

### Config

- [ ] All hardcoded values moved to `config.py`
- [ ] `.env.example` created with all expected variables
- [ ] Existing `.env.local` not committed to new repo (verify `.gitignore`)

---

## 10. Dependencies on Other Sub-PRDs

| Dependency | Sub-PRD | What This PRD Needs From It |
|---|---|---|
| Detection ML | [03a](./03a-detection-ml.md) | Detection pipeline logic, evidence fusion module, threat reasoner |
| Investigation Agent | [03e](./03e-investigation-agent.md) | Agent implementation that the Orchestrator calls |
| Policy Engine | [03f](./03f-policy-engine.md) | Policy enforcement layer called by the agent |
| Extension | [03c](./03c-extension.md) | Extension must call new routes correctly |
| Dashboard | [03d](./03d-dashboard-ui.md) | Dashboard must display investigation data from new routes |
| Intent & Correct Path | [03g](./03g-intent-correct-path.md) | Intent inference and correct path modules called by orchestrator |
| Recovery | [03h](./03h-recovery-workflow.md) | Recovery workflow module called by orchestrator |

## 11. What Breaks If This Contract Changes

| If This Changes... | These Sub-PRDs Break |
|---|---|
| API route paths or response shapes | Extension (calls them), Dashboard (calls them) |
| Investigation polling schema | Extension (polls it) |
| DB table schemas | All backend modules that query them |
| `config.py` threshold values | Detection pipeline behavior, investigation trigger logic |
| CORS origins | Dashboard access, extension access |

---

*Next: [Extension](./03c-extension.md)*
