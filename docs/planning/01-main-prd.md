# ClickWise — Main Product Requirements Document

> **Document:** `docs/planning/01-main-prd.md`
> **Audience:** Any team member or SIH judge — no code literacy required
> **Depends on:** [Delta List](./00-delta-list.md)
> **Referenced by:** All sub-PRDs, [System Design](./02-system-design.md)

---

## Problem Statement

Phishing and social-engineering attacks no longer rely on obvious scam emails. Modern attackers build convincing clones of banking portals, government services, and payment platforms — complete with correct branding, urgency language, and professional layout. Existing browser-level defenses respond by detecting the threat and displaying a warning or a block page, then walking away. The user — often someone without security training — is left stranded, confused, and frequently annoyed enough to override the warning entirely. **Detection alone fails because it treats the symptom (the malicious page) without addressing the cause (the user still needs to accomplish something).** ClickWise closes this gap: when it detects a threat, it investigates the suspicious site autonomously, determines what the user was actually trying to do, blocks the fake, and opens the real destination. Security becomes assistance, not friction.

---

## Who This Protects

**1. Digitally inexperienced users** — A grandmother receives "Your bank account will be blocked today. Verify immediately." She doesn't know what a domain is. ClickWise should say, in plain language: *"This site is pretending to be your bank. I've blocked it and opened the real one for you."*

**2. Students** — Fake scholarship portals, placement links, and internship scams exploit urgency and hope. ClickWise identifies the impersonation and redirects to the real university or portal.

**3. First-time digital-banking users** — A large population moving from cash to UPI/net-banking for the first time, with no instinct for what a fake page looks like. ClickWise provides the safety net they don't know they need.

> **Design principle:** Complexity belongs to the machine. Clarity belongs to the user.

---

## The Core Loop

```
Detect  →  Investigate  →  Reason  →  Correct Path  →  Recover
```

| Stage | What Happens |
|---|---|
| **Detect** | ML classifier + URL heuristics + optional LLM check flag a suspicious URL |
| **Investigate** | An autonomous agent opens the suspicious page in an isolated browser, alongside the real trusted site, and collects evidence: DOM structure, login forms, redirect chains, visual similarity, urgency language |
| **Reason** | All evidence signals are fused into a single explainable verdict with a confidence score and a human-readable explanation |
| **Correct Path** | The system infers the user's original intent (e.g., "access SBI net banking"), blocks the fake page, and opens the legitimate destination directly |
| **Recover** | If the user already entered credentials or payment info before the block, ClickWise provides structured recovery guidance (password reset steps, card freeze instructions) — guidance only, never autonomous account actions |

**"Correct Path" is the differentiator.** Every demo and pitch should lead with this: the system doesn't just block — it understands what the user wanted and gets them there safely.

---

## What's Already Built vs What's New

*(Full details: [Delta List](./00-delta-list.md))*

### Already Built (existing codebase)
- Chrome Extension (MV3) — detects URLs, blocks high-risk pages, shows risk badges
- FastAPI Backend — serves detection API, stores scan results in SQLite
- LightGBM ML Model — 29-feature URL classifier, AUC-ROC 0.993 on held-out data
- Next.js Dashboard — KPI stats (total scans, threats blocked, activity log)
- Gemini LLM Integration — double-checks ambiguous URLs, powers a chat assistant

### Current flow: **Detect → Block** (and stop)

### New (must be built for SIH)
- Investigation Agent (isolated Playwright browser)
- Policy Engine (deterministic safety layer between AI and actions)
- Evidence Fusion meta-model (replacing hand-tuned score blending)
- Explainable Reasoning / Verdict generation
- Intent Inference + Correct Path redirection
- Trusted Source Registry (org-to-official-domain mapping)
- Recovery Workflow Engine
- Incident Investigation Console (dashboard upgrade)
- Agent state machine, bounded planner, observability/trace logging

### Target flow: **Detect → Investigate → Reason → Correct Path → Recover**

---

## Scope Boundaries

### 🟢 Core Build (must work, polished, demoed live)

1. Detection engine — retrained LightGBM + heuristics + LLM verification
2. Investigation Agent — Playwright-based isolated browser, constrained tool interface
3. Policy Engine — deterministic action-risk enforcement (5 risk tiers)
4. Evidence Fusion — trained stacked meta-model replacing hand-tuned weights
5. Explainable Verdict — human-readable reasoning for every decision
6. **Correct Path** redirection — intent inference + Trusted Source Registry (20–50 orgs)
7. Basic Recovery Guidance — structured flows for credential and payment exposure
8. One flagship demo scenario (bank/KYC scam) built end-to-end; 2–3 secondary scenarios as screenshots/recordings

### 🟡 Upgrade (build if time allows, in priority order)

1. Visual/logo similarity detection (screenshot embedding + cosine similarity)
2. Threat intelligence feed integration (PhishTank, OpenPhish — clearly label any mocked data)
3. Family protection notifications (opt-in alert when high-severity threat is blocked)
4. Enterprise/SOC incident view on dashboard

### 🔴 Explicitly Out of Scope

- **Automated account recovery actions** — no password resets, session revocations, or API calls to real services. Guidance only.
- **Investigating live real-world malicious sites** during demo — build controlled phishing clones instead. Same demo impact, no legal/safety risk.
- **Multi-agent framework** — do not adopt an agent framework. Build a lightweight state-machine orchestrator. Splitting into named agents is an upgrade only after the pipeline works end-to-end.
- **Blockchain** — the SIH theme includes it, but it adds no value here. Do not build blockchain features.
- **Generic AI chatbot** — the existing Sentinel AI chat stays as-is; do not expand it into a general assistant.

> **Scope discipline matters.** This project has a documented tendency toward scope creep. Every feature not in "Core Build" must be explicitly justified before starting.

---

## Success Criteria

### Security Metrics
| Metric | Target |
|---|---|
| Detection precision | ≥ 95% on benchmark |
| Detection recall | ≥ 90% (catching real phishing is more important than perfect precision) |
| False positive rate | ≤ 5% (blocking legitimate sites erodes user trust) |
| Impersonation detection accuracy | ≥ 85% on known-brand clone scenarios |

### Agent Performance Metrics
| Metric | Target |
|---|---|
| Investigation completion rate | ≥ 90% of triggered investigations complete within bounds |
| Average investigation time | ≤ 15 seconds |
| Correct Path redirection accuracy | ≥ 80% (user ends up on the right legitimate site) |

### Human Impact Metrics
| Metric | Target |
|---|---|
| Verdict comprehension | A non-technical user can understand the explanation without help |
| Threats resolved without manual intervention | ≥ 70% |
| User disables extension after false positive | Measured; target: declining trend |

### Safety Metrics
| Metric | Target |
|---|---|
| Unauthorized autonomous action rate | 0 (hard requirement) |
| Prompt injection resistance | Agent ignores embedded instructions from page content |
| Wrong redirection rate | ≤ 2% (redirecting to wrong "legitimate" site is worse than not redirecting) |

---

## Overclaim Correction

The source documents state: *"Every existing phishing tool stops at BLOCKED."* This is too absolute — several commercial products (e.g., Google Safe Browsing, Microsoft SmartScreen) do more than simple blocking, and an informed judge will challenge this immediately.

**The defensible claim is:** Most conventional browser-level phishing defenses primarily focus on detection, warning, or blocking. ClickWise extends this model by autonomously investigating ambiguous threats in an isolated environment, inferring the user's intended task, and providing a verified safe path to the legitimate destination. The novelty is the **Correct Path** mechanism — not detection quality, which is a well-solved problem, but the response model: turning security from a gate into a guide.

Similarly, the reported AUC-ROC of 0.993 is on a held-out split of a specific dataset. It should not be presented as real-world accuracy. Report it honestly as a baseline benchmark with caveats about dataset provenance, temporal leakage risk, and domain-level splitting.

---

*Next: [System Design](./02-system-design.md) (Step 3)*
