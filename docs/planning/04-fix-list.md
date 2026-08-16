# Fix List — Existing Code Issues

> **Document:** `docs/planning/04-fix-list.md`
> **Owner:** Planning Lead
> **Status:** Prioritized list of fixes for existing code. Execute before building new features.

---

## Priority: 🔴 CRITICAL (fix immediately)

| # | Issue | File | Line | Fix |
|---|---|---|---|---|
| 1 | ~~**API key committed to repo**~~ | [`.env.local`](../../.env.local) | L1 | ~~Rotate the Gemini API key immediately. Remove `.env.local` from git tracking: `git rm --cached .env.local`. Verify `.gitignore` catches it.~~ |
| 2 | ~~**Unauthenticated DELETE /reset**~~ | [`main.py`](../../backend/main.py) | L782 | ~~Add `require_admin_key` dependency (see [Backend API §4](./prds/03b-backend-api.md#4-authentication-strategy)).~~ |
| 3 | ~~**Port mismatch (8000 vs 8002)**~~ | [`main.py`](../../backend/main.py) | L989 | ~~Change `port=8000` to `port=8002` in `__main__` block.~~ |
| 4 | ~~**Duplicate SQLite databases**~~ | `backend/sql_app.db` (1.3MB stale) + `backend/app/sql_app.db` (2.5MB active) | — | ~~Delete `backend/sql_app.db`. Keep `backend/app/sql_app.db`.~~ |

## Priority: 🟡 HIGH (fix before demo)

| # | Issue | File | Line | Fix |
|---|---|---|---|---|
| 5 | **Open CORS (`*`)** | [`main.py`](../../backend/main.py) | L38 | Change to explicit origins: `chrome-extension://*`, `localhost:3000`, `127.0.0.1:3000` |
| 6 | **Server binds to 0.0.0.0** | [`start_server_v3.py`](../../start_server_v3.py) | L13 | Change `host="0.0.0.0"` to `host="127.0.0.1"` |
| 7 | **Sync `time.sleep` in async context** | [`llm.py`](../../backend/app/services/llm.py) | L126 | Replace `time.sleep()` with `await asyncio.sleep()` |
| 8 | **Triple-defined privacy endpoint** | [`main.py`](../../backend/main.py) | L750, L764, L773 | Delete L750 and L764 handlers. Keep L773. |
| 9 | **Stub `/api/v1/analyze` always returns 0** | [`main.py`](../../backend/main.py) | L793 | Either implement (route to language analysis) or remove. |
| 10 | **Missing `/temporal/analyze` endpoint** | [`service-worker.js`](../../extension-clean/src/background/service-worker.js) | L197 | Extension calls it but backend doesn't have it. Implement or remove the extension call. |
| 11 | **`pandas` not in requirements.txt** | [`requirements.txt`](../../backend/requirements.txt) | — | Add `pandas` — it's imported at runtime in `get_ml_score()` ([L222](../../backend/main.py)). |
| 12 | **Name: "SecureSentinel" everywhere** | Multiple files | — | Rename to "ClickWise" (Claude task — may already be done). |

## Priority: 🟢 MEDIUM (fix during refactor)

| # | Issue | File | Line | Fix |
|---|---|---|---|---|
| 13 | **4-second blocklist polling** | [`service-worker.js`](../../extension-clean/src/background/service-worker.js) | L130 | Change to exponential backoff (10s → 60s). |
| 14 | **Content script scans all links** | [`content.js`](../../extension-clean/src/content/content.js) | — | Switch to hover-only scanning. |
| 15 | **Variable shadowing** | [`main.py`](../../backend/main.py) | L480-481 | `for domain in BENIGN_DOMAINS` shadows outer `domain`. Rename loop var. |
| 16 | **Pandas imported per-call** | [`main.py`](../../backend/main.py) | L222 | Move `import pandas as pd` to top of file. |
| 17 | **Commented-out router import** | [`main.py`](../../backend/main.py) | L826-828 | Delete the commented code. |
| 18 | **Dead model files (34MB total)** | `models/` | — | Delete: `model_baseline.joblib`, `model_enhanced.joblib`, `model_scalable.joblib`, and all 3 vectorizers. |
| 19 | **No `.env.example`** | Project root | — | Create with documented env vars. |

## Priority: ⚪ POST-HACKATHON

| # | Issue | Fix |
|---|---|---|
| 20 | No authentication on any endpoint | Implement proper auth (JWT or session-based) |
| 21 | SQLite for production | Migrate to PostgreSQL |
| 22 | No rate limiting | Add rate limiting middleware |
| 23 | No request validation (beyond Pydantic) | Add input sanitization |
| 24 | No HTTPS enforcement | Add HTTPS redirect |
| 25 | No logging framework | Replace `print()` with structured logging |

---

## Execution Order

1. Fix #1 (rotate API key) — **do this right now**
2. Fix #3, #4 (port + stale DB) — 5 minutes
3. Fix #12 (rename) — Claude is handling this
4. Fix #5, #6, #7, #8 (CORS, bind, async, triple endpoint) — 15 minutes
5. Fix #13, #14, #15, #16, #17 — during de-monolith (Backend API §1.3)
6. Fix #18 (dead models) — after ML retrain
7. Fix #19 (`.env.example`) — Claude/Kiro can handle this
