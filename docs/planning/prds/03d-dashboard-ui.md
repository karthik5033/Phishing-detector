# Sub-PRD: Dashboard / UI

> **Document:** `docs/planning/prds/03d-dashboard-ui.md`
> **Owner:** Frontend/Product Lead (Member 6)
> **Depends on:** [System Design](../02-system-design.md), [Backend API](./03b-backend-api.md)
> **Status:** Sub-PRD — must not contradict System Design

---

## Contracts Consumed

| Contract | Source | Section |
|---|---|---|
| `GET /api/v1/dashboard` response | [Backend API](./03b-backend-api.md#24-complete-route-table-post-de-monolith) | §2.4 |
| `GET /api/v1/stats/summary` response | [Backend API](./03b-backend-api.md#24-complete-route-table-post-de-monolith) | §2.4 |
| `GET /api/v1/investigations` response | [Backend API](./03b-backend-api.md#21-investigation-routes) | §2.1 |
| `GET /api/v1/investigation/{id}` response | [System Design](../02-system-design.md#32-extension--backend-investigation-polling) | §3.2 |
| `GET /api/v1/investigation/{id}/trace` response | [Backend API](./03b-backend-api.md#21-investigation-routes) | §2.1 |
| `Verdict` schema | [System Design](../02-system-design.md#36-evidence-fusion--threat-reasoner-verdict-generation) | §3.6 |
| `CorrectPathResult` schema | [System Design](../02-system-design.md#37-threat-reasoner--intent-inference--correct-path) | §3.7 |
| `EvidenceSignal` catalog | [Detection ML](./03a-detection-ml.md#23-signal-catalog) | §2.3 |
| `investigation_status` enum | [System Design](../02-system-design.md#13-enums-and-status-values) | §1.3 |

## Contracts Produced

| Contract | Consumers |
|---|---|
| Dashboard URL patterns (for "View in Dashboard" links from extension) | [Extension](./03c-extension.md) |

---

## Scope

### In Scope

1. Rebrand dashboard from "SecureSentinel" to "ClickWise" (theme + text)
2. Keep and polish existing KPI dashboard
3. Build the **Incident Investigation Console** — the flagship new dashboard view
4. Build the **Investigation Detail** view with evidence breakdown and agent trace
5. Update navigation structure
6. Ensure responsive layout (desktop-first, tablet-acceptable)

### Out of Scope

- Extension UI (see [Extension](./03c-extension.md))
- Backend API routes (see [Backend API](./03b-backend-api.md))
- Landing page changes (current marketing pages stay as-is)
- Mobile-first optimization (hackathon = desktop demo)

---

## 1. Dashboard Architecture

### 1.1 Current Structure

```
my-app/app/
├── dashboard/
│   ├── page.tsx              ← Main KPI dashboard (20 KB)
│   ├── layout.tsx            ← Sidebar + layout
│   ├── activity/             ← Activity log
│   ├── controls/             ← Settings controls
│   └── privacy/              ← Privacy settings
├── analyze/                  ← URL analysis page
├── blocked/                  ← Blocked domains
└── ... (other routes)
```

### 1.2 Target Structure

```
my-app/app/
├── dashboard/
│   ├── page.tsx              ← KEEP: KPI overview (polished)
│   ├── layout.tsx            ← MODIFY: add new nav items
│   ├── activity/             ← KEEP: activity log
│   ├── controls/             ← KEEP: settings
│   ├── privacy/              ← KEEP: privacy settings
│   ├── investigations/       ← NEW: Investigation Console
│   │   ├── page.tsx          ← Investigation list (table)
│   │   └── [id]/
│   │       └── page.tsx      ← Investigation detail view
│   └── live/                 ← NEW: Live investigation view (optional)
│       └── page.tsx
├── analyze/                  ← KEEP
├── blocked/                  ← KEEP
└── ...
```

---

## 2. Navigation Update

### 2.1 Current Sidebar

```
📊 Dashboard        (KPI overview)
📋 Activity          (scan history)
🛡️ Controls          (block/allow settings)
🔒 Privacy           (data retention)
```

### 2.2 Updated Sidebar

```
📊 Overview           (KPI overview — existing, polished)
🔍 Investigations     (NEW — investigation list + detail)
📋 Activity           (scan history — existing)
🛡️ Controls           (block/allow — existing)
🔒 Privacy            (data retention — existing)
```

### 2.3 URL Pattern Contract

These URLs are referenced by the extension's "View in Dashboard" links:

| Route | Purpose | Link From |
|---|---|---|
| `/dashboard` | KPI overview | Extension popup "View Dashboard" |
| `/dashboard/investigations` | Investigation list | Extension popup "View All Investigations" |
| `/dashboard/investigations/[id]` | Investigation detail | Extension investigation page "View full trace" |
| `/dashboard/activity` | Activity log | Extension popup "View History" |

---

## 3. KPI Overview Polish

### 3.1 What Changes

The existing KPI dashboard ([`dashboard/page.tsx`](../../../my-app/app/dashboard/page.tsx)) stays but gets polished:

1. **Add investigation KPIs** alongside existing scan KPIs:
   - "Investigations Completed" count
   - "Correct Paths Served" count (successful redirects)
   - "Average Investigation Time" (seconds)

2. **Update the activity trend chart** to distinguish:
   - Scans (existing blue line)
   - Threats Blocked (existing red area)
   - Investigations Triggered (new purple dots)

3. **Add "Recent Investigations" widget** below existing "Recent Interventions":
   ```
   ┌──────────────────────────────────────────────────────┐
   │ Recent Investigations                                │
   ├──────────────────────────────────────────────────────┤
   │ 🔴 sbi-login-verify.example.com  PHISHING  12s  → │
   │ 🟡 discount-offer.fake.shop      SUSPICIOUS 8s  → │
   │ 🟢 amazon.in                     LEGITIMATE 5s  → │
   └──────────────────────────────────────────────────────┘
   ```

### 3.2 Data Source

New KPI data comes from `GET /api/v1/investigations` (aggregate from the response).

---

## 4. Investigation Console (New — Primary Feature)

### 4.1 Investigation List (`/dashboard/investigations`)

A table/list view of all investigations with filtering and sorting.

**Layout:**

```
┌──────────────────────────────────────────────────────────────────┐
│  🔍 Investigations                              [Filter ▾] [↻]  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────┬──────────────────────────┬─────────┬──────┬─────┬──────┐│
│  │ #  │ URL                      │ Verdict │ Conf │ Time│ When ││
│  ├────┼──────────────────────────┼─────────┼──────┼─────┼──────┤│
│  │ 1  │ sbi-login-verify.ex...   │ 🔴 PHSH│ 96%  │ 12s │ 2m   ││
│  │ 2  │ discount-offer.fake...   │ 🟡 SUSP│ 68%  │ 8s  │ 15m  ││
│  │ 3  │ amazon.in                │ 🟢 LEGM│ 92%  │ 5s  │ 1h   ││
│  │ 4  │ fake-scholarship.cc      │ 🔴 PHSH│ 89%  │ 14s │ 2h   ││
│  │ 5  │ gov-update.xyz           │ ⚪ INCN│ 42%  │ 30s │ 3h   ││
│  └────┴──────────────────────────┴─────────┴──────┴─────┴──────┘│
│                                                                  │
│  ← 1 2 3 →                                        20 per page   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Filters:**
- Verdict label: ALL / PHISHING / SUSPICIOUS / LEGITIMATE / INCONCLUSIVE
- Status: ALL / COMPLETE / FAILED / TIMED_OUT / IN PROGRESS
- Time range: Last hour / Last 24h / Last 7 days / All time

**Sorting:**
- By time (newest first — default)
- By confidence (highest first)
- By investigation duration

**Row click:** Navigate to `/dashboard/investigations/[id]`

### 4.2 Investigation Detail (`/dashboard/investigations/[id]`)

The detail view for a single investigation. This is the **most important new UI** — it's what judges will look at closely.

**Layout — 3 sections:**

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Back to Investigations                                        │
│                                                                  │
│  Investigation: inv_a1b2c3d4                                     │
│  URL: sbi-login-verify.example.com/kyc                          │
│  Status: ✅ COMPLETE • 12 seconds • 10 steps                    │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─── SECTION 1: VERDICT ─────────────────────────────────────┐ │
│  │                                                             │ │
│  │  🔴 PHISHING — 96% confidence                              │ │
│  │                                                             │ │
│  │  "This site is impersonating State Bank of India.           │ │
│  │   The login page closely matches the real SBI portal        │ │
│  │   but is hosted on a different domain."                     │ │
│  │                                                             │ │
│  │  Attack Type: Credential Phishing                           │ │
│  │  Claimed Organization: State Bank of India                  │ │
│  │                                                             │ │
│  │  Correct Path: ✅ onlinesbi.sbi.co.in (Curated Registry)   │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─── SECTION 2: EVIDENCE BREAKDOWN ──────────────────────────┐ │
│  │                                                             │ │
│  │  Signal              Score   Contribution                   │ │
│  │  ─────────────────────────────────────────                  │ │
│  │  domain_mismatch      0.98   ▓▓▓▓▓▓▓▓▓▓▓▓ 28%             │ │
│  │  brand_impersonation  0.95   ▓▓▓▓▓▓▓▓▓▓   22%             │ │
│  │  dom_login_form       0.90   ▓▓▓▓▓▓▓▓     18%             │ │
│  │  ml_url_score         0.82   ▓▓▓▓▓▓       12%             │ │
│  │  visual_similarity    0.88   ▓▓▓▓▓        10%             │ │
│  │  urgency_language     0.85   ▓▓▓▓         8%              │ │
│  │  dom_otp_field        0.85   ▓▓           4%              │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─── SECTION 3: INVESTIGATION TRACE ─────────────────────────┐ │
│  │                                                             │ │
│  │  Timeline (12 seconds)                                      │ │
│  │  ═══════════════════════════════════════                    │ │
│  │                                                             │ │
│  │  0.0s  PENDING → OBSERVING                                  │ │
│  │        ├─ screenshot          450ms ✅                      │ │
│  │        ├─ inspect_dom         120ms ✅                      │ │
│  │        └─ get_page_text       80ms  ✅                      │ │
│  │                                                             │ │
│  │  0.7s  OBSERVING → ASSESSING                                │ │
│  │        └─ generate_plan       200ms ✅                      │ │
│  │                                                             │ │
│  │  0.9s  ASSESSING → INVESTIGATING                            │ │
│  │        ├─ extract_forms       150ms ✅ "login form found"   │ │
│  │        ├─ extract_links       100ms ✅                      │ │
│  │        ├─ click #loginBtn     300ms ✅ [POLICY: ALLOW]      │ │
│  │        ├─ inspect_network     200ms ✅ "external submit"    │ │
│  │        └─ navigate ref_site   500ms ✅ "loaded SBI real"    │ │
│  │                                                             │ │
│  │  3.1s  INVESTIGATING → COLLECTING_EVIDENCE                  │ │
│  │        └─ compare_branding    800ms ✅                      │ │
│  │                                                             │ │
│  │  ...                                                        │ │
│  │                                                             │ │
│  │  11.8s RESPONDING → VERIFYING_RESPONSE                      │ │
│  │  12.0s VERIFYING_RESPONSE → COMPLETE                        │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 4.3 Section Details

#### Section 1: Verdict Card

- Verdict label with color (red/amber/green/gray) and confidence percentage
- Explanation text (from `verdict.explanation`)
- Attack type (from `verdict.attack_type`)
- Claimed organization
- Correct Path destination with trust source badge:
  - 🟢 Curated Registry (highest trust)
  - 🔵 Verified Official
  - 🟡 Search Discovery
  - 🟠 LLM Reasoning (lowest trust)

#### Section 2: Evidence Breakdown

- Horizontal bar chart showing each evidence signal's contribution to the final probability
- Data source: `verdict.evidence` array + `EvidenceFusionResult.feature_importances`
- Sort by contribution (highest first)
- Bar color: red for high scores (0.7+), amber for medium (0.4–0.7), gray for low (<0.4)

#### Section 3: Investigation Trace

- Vertical timeline showing every action the Investigation Agent performed
- Each entry shows: timestamp, state, action name, duration, result, and policy decision
- Data source: `GET /api/v1/investigation/{id}/trace`
- State transitions shown as horizontal separator lines with state names
- Policy decisions shown inline: `[POLICY: ALLOW]`, `[POLICY: BLOCK]`, `[POLICY: REQUIRE_APPROVAL]`
- Color coding: green for successful actions, red for blocked actions, amber for required-approval

---

## 5. Component Design

### 5.1 New Components Needed

```
my-app/components/
├── dashboard/
│   ├── ... (existing components)
│   │
│   ├── InvestigationList.tsx       ← NEW: table with filters/sort
│   ├── InvestigationDetail.tsx     ← NEW: full detail view
│   ├── VerdictCard.tsx             ← NEW: verdict display with color/icon
│   ├── EvidenceChart.tsx           ← NEW: horizontal bar chart
│   ├── InvestigationTimeline.tsx   ← NEW: vertical trace timeline
│   ├── TrustSourceBadge.tsx        ← NEW: colored badge for trust source
│   ├── InvestigationKpiCards.tsx   ← NEW: investigation stat cards
│   └── InvestigationStatusBadge.tsx← NEW: status pill (COMPLETE/FAILED/etc.)
```

### 5.2 Component Contracts

#### `VerdictCard`

```typescript
interface VerdictCardProps {
    label: "PHISHING" | "SUSPICIOUS" | "LEGITIMATE" | "INCONCLUSIVE";
    probability: number;          // 0.0–1.0
    explanation: string;
    attackType: string | null;
    claimedOrganization: string | null;
    correctPath: {
        destinationUrl: string;
        organization: string;
        trustSource: "CURATED_REGISTRY" | "VERIFIED_OFFICIAL" | "SEARCH_DISCOVERY" | "LLM_REASONING";
        confidence: number;
    } | null;
}
```

#### `EvidenceChart`

```typescript
interface EvidenceChartProps {
    evidence: Array<{
        signal: string;
        score: number;
        detail: string;
    }>;
    featureImportances: Record<string, number>;  // signal_name → contribution %
}
```

#### `InvestigationTimeline`

```typescript
interface TraceEntry {
    timestamp: string;
    state: string;
    action: string;
    result: string | null;
    durationMs: number | null;
    policyDecision?: "ALLOW" | "BLOCK" | "REQUIRE_APPROVAL";
}

interface InvestigationTimelineProps {
    trace: TraceEntry[];
    totalElapsedSeconds: number;
}
```

---

## 6. Data Fetching

### 6.1 API Client

Create a shared API client for the dashboard:

```typescript
// my-app/lib/api.ts

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8002/api/v1";

export async function fetchInvestigations(page = 1, limit = 20, filters = {}) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit), ...filters });
    const response = await fetch(`${API_BASE}/investigations?${params}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
}

export async function fetchInvestigation(id: string) {
    const response = await fetch(`${API_BASE}/investigation/${id}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
}

export async function fetchInvestigationTrace(id: string) {
    const response = await fetch(`${API_BASE}/investigation/${id}/trace`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
}

export async function fetchDashboard() {
    const response = await fetch(`${API_BASE}/dashboard`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
}
```

### 6.2 Polling for Active Investigations

If the dashboard is open while an investigation is running, use client-side polling to show live progress:

```typescript
// my-app/hooks/useInvestigationPoll.ts

import { useState, useEffect } from 'react';
import { fetchInvestigation } from '@/lib/api';

export function useInvestigationPoll(id: string, enabled: boolean) {
    const [data, setData] = useState(null);

    useEffect(() => {
        if (!enabled) return;

        const poll = setInterval(async () => {
            try {
                const result = await fetchInvestigation(id);
                setData(result);

                // Stop polling on terminal state
                if (["COMPLETE", "FAILED", "TIMED_OUT"].includes(result.status)) {
                    clearInterval(poll);
                }
            } catch (e) {
                console.error("Poll error:", e);
            }
        }, 2000);

        return () => clearInterval(poll);
    }, [id, enabled]);

    return data;
}
```

---

## 7. Theming & Branding

### 7.1 Color System

| Purpose | Current | New |
|---|---|---|
| Primary brand | Mixed / red-orange | `#2563eb` (blue-600) — trust, security |
| Danger / phishing | `#ef4444` (red) | Keep `#ef4444` |
| Warning / suspicious | `#f59e0b` (amber) | Keep `#f59e0b` |
| Safe / legitimate | `#10b981` (green) | Keep `#10b981` |
| Inconclusive | — | `#6b7280` (gray-500) |
| Investigation active | — | `#3b82f6` (blue-500) |
| Background | Dark theme | Keep dark theme |

### 7.2 Typography

Use the existing font stack from the Next.js project. No changes needed.

### 7.3 Name Change

Replace all instances of "SecureSentinel" / "Sentinel" in dashboard text with "ClickWise":
- Page titles
- Sidebar labels
- KPI card headers
- Empty state messages
- Footer text

---

## 8. Demo Optimization

### 8.1 What Judges Will See

The dashboard demo should flow like this:

1. **Open dashboard** → See KPI overview with investigation stats
2. **Click "Investigations"** → See list of past investigations
3. **Click on a phishing investigation** → See full verdict, evidence breakdown, agent trace
4. **Highlight the evidence chart** → "This is how the system explains its reasoning"
5. **Scroll to the trace** → "This is every action the investigation agent took, with policy engine decisions"
6. **Point to the Correct Path badge** → "The system identified the real SBI site and redirected the user there"

### 8.2 Empty State

If no investigations have been run yet, the Investigation Console should show:

```
┌──────────────────────────────────────────────┐
│                                              │
│  🔍 No investigations yet                    │
│                                              │
│  Investigations are triggered automatically  │
│  when ClickWise detects a suspicious URL.    │
│                                              │
│  Try visiting a test phishing page from      │
│  the benchmark scenarios to see it in action.│
│                                              │
└──────────────────────────────────────────────┘
```

### 8.3 Seed Data for Demo

If the system has been tested against the benchmark phishing pages (see Kiro's benchmark task), the dashboard should show those investigation results. Consider creating a `backend/scripts/seed_demo_data.py` script that populates the investigation tables with realistic demo data for presentation purposes.

---

## 9. Test / Acceptance Checklist

### Navigation

- [ ] Sidebar has "Investigations" link that navigates to `/dashboard/investigations`
- [ ] "Overview" (KPI) page still works with all existing stats
- [ ] All existing pages (Activity, Controls, Privacy) unchanged and functional

### Investigation List

- [ ] Table shows investigation ID, URL, verdict, confidence, time, age
- [ ] Color coding matches verdict label (red/amber/green/gray)
- [ ] Filter by verdict label works
- [ ] Filter by status works
- [ ] Sort by time/confidence/duration works
- [ ] Pagination works
- [ ] Row click navigates to detail view
- [ ] Empty state displayed when no investigations exist

### Investigation Detail

- [ ] Verdict card displays label, probability, explanation, attack type
- [ ] Evidence chart shows horizontal bars sorted by contribution
- [ ] Investigation trace timeline renders all entries with timestamps
- [ ] Policy decisions shown inline on trace entries
- [ ] State transitions clearly marked
- [ ] "Back to Investigations" link works
- [ ] Page loads correctly from direct URL (not just navigation)

### KPI Updates

- [ ] "Investigations Completed" KPI card shows correct count
- [ ] "Correct Paths Served" KPI card shows correct count
- [ ] "Avg Investigation Time" KPI card shows correct average
- [ ] "Recent Investigations" widget appears on overview page

### Branding

- [ ] All "SecureSentinel" text replaced with "ClickWise"
- [ ] Color scheme uses blue primary (not red)
- [ ] Dark theme maintained

### Performance

- [ ] Investigation list loads in < 500ms
- [ ] Investigation detail loads in < 500ms
- [ ] Live polling updates smoothly (no flicker)

---

## 10. Dependencies on Other Sub-PRDs

| Dependency | Sub-PRD | What This PRD Needs |
|---|---|---|
| Backend API | [03b](./03b-backend-api.md) | All investigation API routes |
| Detection ML | [03a](./03a-detection-ml.md) | Signal names for evidence chart |
| Extension | [03c](./03c-extension.md) | "View in Dashboard" links point to dashboard URLs defined here |

## 11. What Breaks If This Contract Changes

| If This Changes... | These Break |
|---|---|
| Dashboard route paths (`/dashboard/investigations/[id]`) | Extension's "View in Dashboard" links |
| Component prop interfaces | Any component consumers (pages) |
| API client function signatures | All pages that fetch data |

---

*Next: [Investigation Agent](./03e-investigation-agent.md)*
