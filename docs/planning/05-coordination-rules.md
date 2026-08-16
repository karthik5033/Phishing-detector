# Coordination Rules

> **Document:** `docs/planning/05-coordination-rules.md`
> **Owner:** Planning Lead
> **Status:** Binding rules for all team members and AI agents working on ClickWise.

---

## 1. File Ownership

**Rule:** Only one person/agent modifies a file at a time. Before editing, check this table.

| Directory/File | Owner | Notes |
|---|---|---|
| `docs/planning/` | Planning Lead (Antigravity) | Planning docs — do not edit without re-approval |
| `backend/main.py` | Backend Lead | During de-monolith only — once split, see route files below |
| `backend/api/routes/` | Backend Lead | All API route files |
| `backend/detection/` | ML Lead | Detection pipeline, evidence fusion, threat reasoner |
| `backend/investigation/` | Agent Lead | Investigation agent, browser sandbox, tool executor |
| `backend/investigation/browser/policies.py` | Agent Lead | Policy Engine |
| `backend/intent/` | NLP Lead | Intent inference, correct path |
| `backend/trusted_sources/` | Any (seed data) | Shared — coordinate before editing registry.py |
| `backend/recovery/` | Backend Lead | Recovery workflow engine |
| `backend/app/models.py` | Backend Lead | DB models — coordinate for new tables |
| `backend/app/database.py` | Backend Lead | DB connection — rarely changes |
| `backend/config.py` | Backend Lead | Config — notify all if thresholds change |
| `extension-clean/` | Frontend Lead | Chrome extension — all files |
| `my-app/` | Frontend Lead | Dashboard — all files |
| `models/` | ML Lead | Model files |
| `benchmark/` | Any | Test scenarios — low conflict risk |
| `scripts/` | ML Lead | Training scripts |

---

## 2. Contract Change Protocol

If you need to change something defined in `02-system-design.md`:

1. **Stop.** Do not change it silently.
2. Open the System Design doc and find the exact section.
3. Write down: what you want to change, why, and what breaks (check the "What Breaks" table in the relevant sub-PRD).
4. Notify all affected sub-PRD owners.
5. Get explicit approval from Planning Lead.
6. Update the System Design doc FIRST, then update all affected sub-PRDs.
7. Only THEN change the code.

**If you skip this protocol, you will break other people's work.**

---

## 3. Naming Conventions

### Code

| Type | Convention | Example |
|---|---|---|
| Python modules | `snake_case` | `evidence_fusion.py` |
| Python classes | `PascalCase` | `InvestigationAgent` |
| Python functions | `snake_case` | `extract_forms()` |
| Python constants | `UPPER_SNAKE_CASE` | `DETECTION_THRESHOLD_BLOCK` |
| JS files | `kebab-case` | `service-worker.js` |
| JS functions | `camelCase` | `startInvestigationPoll()` |
| React components | `PascalCase` | `VerdictCard.tsx` |
| API routes | `kebab-case` | `/api/v1/investigation/{id}` |
| DB tables | `snake_case` plural | `investigations` |
| DB columns | `snake_case` | `risk_level` |

### Enum Values

All enum values use `UPPER_SNAKE_CASE` as defined in System Design §1.3. Do NOT use lowercase or mixed case:
- ✅ `PHISHING`, `OBSERVATION`, `CURATED_REGISTRY`
- ❌ `phishing`, `Observation`, `curatedRegistry`

### Branch Naming

```
feature/[component]-[description]
fix/[component]-[description]
```

Examples:
- `feature/backend-demonolith`
- `feature/agent-playwright-sandbox`
- `fix/extension-polling-backoff`

---

## 4. Merge Rules

1. **Never push directly to `main`.** Use feature branches.
2. Each sub-PRD maps to one or more feature branches.
3. Branch from `main`, merge back to `main` via PR.
4. For the hackathon: team lead reviews PRs. No formal CI required.
5. **Test before merging:** server must start (`python start_server_v3.py`), extension must load without errors, dashboard must render.

---

## 5. Communication Between AI Agents

### Antigravity (this agent)
- **Owns:** Planning docs, coordination, architecture decisions
- **Does NOT touch:** Code in `backend/`, `extension-clean/`, `my-app/` (unless executing approved plan)
- **Outputs:** Planning docs in `docs/planning/`

### Claude (VS Code)
- **Best for:** Code extraction, refactoring, rename operations, file moves
- **Give it:** Specific line ranges, exact target files, clear "do this, don't do that" instructions
- **Avoid:** Open-ended architecture decisions (that's Antigravity's job)

### Kiro (VS Code)
- **Best for:** Spec-driven work, generating data files, building test scenarios
- **Give it:** A spec reference and a clear output format
- **Avoid:** Multi-file refactoring across many directories

### Conflict Prevention Rules

1. **Never assign the same file to two agents.** Check the ownership table above.
2. **Planning docs are mine (Antigravity).** Other agents read them, never edit them.
3. **Seed data and benchmark files are safe for any agent** — they're new files, no conflicts.
4. **If an agent creates a file that another agent needs to read**, commit and push it first, or tell the user to save it before the other agent starts.

---

## 6. Build Execution Order

After all planning docs are complete, this is the recommended build order:

| Phase | What | Who | Depends On |
|---|---|---|---|
| **0** | Fix critical issues (#1-4 from Fix List) | Any agent | Nothing |
| **1** | De-monolith `main.py` (Phase 1-4 from Backend API §1.3) | Claude | Phase 0 |
| **2a** | Build `backend/detection/` modules | ML Lead | Phase 1 |
| **2b** | Build `backend/investigation/browser/sandbox.py` | Agent Lead | Phase 1 |
| **2c** | Build `backend/trusted_sources/` + seed data | Any | Phase 1 |
| **2d** | Update extension for investigation flow | Frontend Lead | Phase 1 |
| **3a** | Build `backend/investigation/agent.py` + tools | Agent Lead | Phase 2b |
| **3b** | Build `backend/investigation/browser/policies.py` | Agent Lead | Phase 2b |
| **3c** | Build `backend/intent/` modules | NLP Lead | Phase 2c |
| **3d** | Build `backend/recovery/` | Backend Lead | Phase 2c |
| **4** | Build `backend/investigation/orchestrator.py` | Backend Lead | Phase 3a-3d |
| **5** | Build investigation API routes | Backend Lead | Phase 4 |
| **6** | Build Dashboard Investigation Console | Frontend Lead | Phase 5 |
| **7** | Integration testing with benchmark scenarios | All | Phase 6 |
| **8** | Demo rehearsal | All | Phase 7 |

> Phases 2a-2d can run in parallel. Phases 3a-3d can run in parallel. All other phases are sequential.

---

## 7. Definition of Done

A feature is "done" when:

1. ✅ Code is written and runs without errors
2. ✅ Acceptance criteria from the sub-PRD are met
3. ✅ Data contracts match System Design exactly (schema, enum values, field names)
4. ✅ Server starts and `/health` returns `200`
5. ✅ Extension loads without console errors
6. ✅ At least one benchmark scenario tested end-to-end
7. ✅ Code is committed to a feature branch

---

*Planning protocol complete. All docs are in `docs/planning/`.*
