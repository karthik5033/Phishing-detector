# Sub-PRD: Extension

> **Document:** `docs/planning/prds/03c-extension.md`
> **Owner:** Frontend/Product Lead (Member 6)
> **Depends on:** [System Design](../02-system-design.md), [Backend API](./03b-backend-api.md)
> **Status:** Sub-PRD — must not contradict System Design

---

## Contracts Consumed

| Contract | Source | Section |
|---|---|---|
| `DetectionResult` (extended with `investigation` field) | [System Design](../02-system-design.md#31-extension--backend-detection-request) | §3.1 |
| Investigation polling schema | [System Design](../02-system-design.md#32-extension--backend-investigation-polling) | §3.2 |
| Communication pattern (polling at 2s) | [System Design](../02-system-design.md#38-backend--extension-communication-pattern) | §3.8 |
| `Verdict` object schema | [System Design](../02-system-design.md#36-evidence-fusion--threat-reasoner-verdict-generation) | §3.6 |
| `CorrectPathResult` schema | [System Design](../02-system-design.md#37-threat-reasoner--intent-inference--correct-path) | §3.7 |
| `RecoveryWorkflow` schema | [System Design](../02-system-design.md#39-recovery-workflow-contract) | §3.9 |
| `risk_level` enum | [System Design](../02-system-design.md#13-enums-and-status-values) | §1.3 |
| `investigation_status` enum | [System Design](../02-system-design.md#13-enums-and-status-values) | §1.3 |
| `verdict_label` enum | [System Design](../02-system-design.md#13-enums-and-status-values) | §1.3 |
| API route table (all routes) | [Backend API](./03b-backend-api.md#24-complete-route-table-post-de-monolith) | §2.4 |

## Contracts Produced

| Contract | Consumers |
|---|---|
| Extension message types (chrome.runtime.onMessage) | Internal — service worker ↔ content scripts ↔ popup |
| Blocked/Investigation page URL format | Backend API (generates redirect URLs) |

---

## Scope

### In Scope

1. Change the extension flow from "detect → block" to "detect → trigger investigation → show pending state → render verdict / Correct Path"
2. New UI states for the popup, badge, and blocked page
3. Polling logic for investigation status
4. Correct Path redirect rendering
5. Recovery guidance display
6. Update extension name/branding to "ClickWise"
7. Fix the 4-second blocklist polling interval
8. Fix content script scanning every link on every page (performance)

### Out of Scope

- Backend API implementation (see [Backend API](./03b-backend-api.md))
- Investigation Agent logic (see [Investigation Agent](./03e-investigation-agent.md))
- Dashboard (see [Dashboard](./03d-dashboard-ui.md))
- ML model changes (see [Detection ML](./03a-detection-ml.md))

---

## 1. Flow Change: Detect → Block becomes Detect → Investigate → Respond

### 1.1 Current Flow

```
User navigates to URL
    ↓
Service Worker calls POST /api/v1/detect
    ↓
If max_risk_score >= 0.75 → redirect to blocked.html
    ↓
Done.
```

### 1.2 New Flow

```
User navigates to URL
    ↓
Service Worker calls POST /api/v1/detect
    ↓
├── If response has NO investigation field (or investigation is null):
│   └── Same as before: block if >= 0.75, warn if >= 0.55, pass otherwise
│
├── If response has investigation field with status "PENDING":
│   ├── Show "Investigating..." interstitial page (NOT blocked.html)
│   ├── Start polling GET /api/v1/investigation/{id} every 2 seconds
│   │
│   ├── While status is non-terminal:
│   │   └── Update interstitial with current_step text and progress
│   │
│   ├── When status becomes "COMPLETE":
│   │   ├── If verdict.label == "PHISHING" or "SUSPICIOUS":
│   │   │   ├── Show verdict page with explanation
│   │   │   ├── If correct_path exists and auto_redirect == true:
│   │   │   │   └── Show "Opening real site..." countdown (3 seconds) → redirect
│   │   │   ├── If correct_path exists and auto_redirect == false:
│   │   │   │   └── Show "Were you trying to access [org]?" with [Go to real site] / [Cancel] buttons
│   │   │   └── If no correct_path:
│   │   │       └── Show verdict only with "Go back to safety" button
│   │   │
│   │   └── If verdict.label == "LEGITIMATE":
│   │       └── Allow navigation, remove interstitial, show green badge
│   │
│   ├── When status becomes "FAILED" or "TIMED_OUT":
│   │   └── Fall back to initial DetectionResult: block if >= 0.75, warn otherwise
│   │
│   └── Max polling duration: 35 seconds (investigation max is 30s + buffer)
│       └── If exceeded: treat as TIMED_OUT
```

### 1.3 Backward Compatibility

The new flow is **additive**. If the backend hasn't been updated yet (no `investigation` field in the response), the extension behaves exactly as before. This allows the backend and extension to be deployed independently.

---

## 2. UI States

### 2.1 Badge States

The extension badge (small icon overlay) needs these states:

| State | Badge Text | Badge Color | Trigger |
|---|---|---|---|
| **Safe** | (empty) | — | `risk_level == "Low"` and no investigation |
| **Warning** | `!` | `#f59e0b` (amber) | `risk_level == "Medium"` |
| **Blocked** | `✗` | `#ef4444` (red) | `risk_level == "High"` or `"Critical"` |
| **Investigating** | `⟳` | `#3b82f6` (blue) | Investigation in progress |
| **Phishing Confirmed** | `✗` | `#ef4444` (red) | Verdict: `PHISHING` |
| **Safe (verified)** | `✓` | `#10b981` (green) | Verdict: `LEGITIMATE` |

### 2.2 Popup States

The extension popup (click on icon) needs to reflect the investigation state of the **current tab's URL**:

**State: No active investigation**
- Show existing stats (scans today, threats blocked, recent history)
- No changes from current behavior

**State: Investigation in progress**
- Show investigation progress:
  ```
  🔍 Investigating...
  ─────────────────────────
  Step 5 of 10
  "Inspecting login form on suspicious page"

  ▓▓▓▓▓▓▓▓░░░░░░ 50%

  Time: 8s
  ```

**State: Investigation complete (phishing)**
- Show verdict summary:
  ```
  🔴 PHISHING DETECTED
  ─────────────────────────
  This site is impersonating State Bank of India.
  Confidence: 96%

  ✓ Brand impersonation detected
  ✓ Login form with OTP field
  ✓ Domain mismatch
  ✓ Urgency language

  [Open Real SBI Site →]
  ```

**State: Investigation complete (legitimate)**
- Show green verification:
  ```
  ✅ VERIFIED SAFE
  ─────────────────────────
  This site has been investigated and appears legitimate.
  ```

### 2.3 Interstitial Page (replaces blocked.html for investigated URLs)

Currently, `blocked.html` is used for all blocked pages. For investigated URLs, create a new page — `investigation.html` — that handles the full lifecycle:

**Phase 1: Investigating**
```
┌─────────────────────────────────────────────┐
│                                             │
│         🔍 ClickWise is investigating       │
│            this page for you...             │
│                                             │
│         ▓▓▓▓▓▓▓▓░░░░░░ 50%                │
│                                             │
│    Inspecting login form on suspicious page │
│                                             │
│         Step 5 of 10 • 8 seconds            │
│                                             │
│    ┌─────────────────────────────────────┐  │
│    │ Why is this happening?             │  │
│    │ ClickWise detected potential risk   │  │
│    │ and is autonomously investigating  │  │
│    │ this page in a safe environment.   │  │
│    └─────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

**Phase 2: Verdict (Phishing)**
```
┌─────────────────────────────────────────────┐
│                                             │
│     🔴 This site is impersonating           │
│        State Bank of India                  │
│                                             │
│     96% likely credential phishing          │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │ What ClickWise found:                 │  │
│  │                                       │  │
│  │ ✓ Login page looks like SBI but is    │  │
│  │   hosted on a different domain        │  │
│  │ ✓ Password and OTP fields detected    │  │
│  │ ✓ Urgency language ("blocked today")  │  │
│  │ ✓ Form submits to suspicious endpoint │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  You were trying to access SBI Online       │
│  Banking. Here's the real site:             │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  🟢 Open onlinesbi.sbi.co.in     →   │  │
│  │     (Official SBI - Verified ✓)       │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  [Go back to safety]   [Report mistake]     │
│                                             │
│  ─────────────────────────────────────────  │
│  🔍 View full investigation trace →         │
│                                             │
└─────────────────────────────────────────────┘
```

**Phase 2b: Verdict (ask user — low confidence Correct Path)**
```
┌─────────────────────────────────────────────┐
│                                             │
│     🟡 This site appears suspicious         │
│                                             │
│  Were you trying to access one of these?    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  State Bank of India               →│    │
│  │  onlinesbi.sbi.co.in                │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [None of these — go back]                  │
│                                             │
└─────────────────────────────────────────────┘
```

**Phase 3: Recovery (if exposure detected)**
```
┌─────────────────────────────────────────────┐
│                                             │
│  ⚠️  You may have entered your password     │
│     on this fake site. Here's what to do:   │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │ 1. Change your SBI password NOW       │  │
│  │    [Open SBI →]                       │  │
│  │                                       │  │
│  │ 2. Revoke active sessions             │  │
│  │    Go to Account Settings → Security  │  │
│  │                                       │  │
│  │ 3. Enable Multi-Factor Auth           │  │
│  │                                       │  │
│  │ 4. Check recent transactions          │  │
│  │                                       │  │
│  │ 5. Call SBI helpline: 1800-11-2211    │  │
│  └───────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 3. Service Worker Changes

### 3.1 New Message Types

Add these message types to the `chrome.runtime.onMessage` handler in [`service-worker.js`](../../../extension-clean/src/background/service-worker.js):

| Message Type | Direction | Purpose |
|---|---|---|
| `INVESTIGATION_STATUS` | SW → popup/content | Broadcast investigation progress update |
| `INVESTIGATION_COMPLETE` | SW → popup/content/investigation page | Broadcast verdict |
| `CORRECT_PATH_REDIRECT` | SW → investigation page | Trigger redirect to legitimate site |
| `DISMISS_INVESTIGATION` | popup/content → SW | User dismisses investigation (e.g., clicks "go back") |
| `REQUEST_INVESTIGATION` | popup → SW | User manually requests deeper investigation from popup |

### 3.2 Investigation Polling Logic

Add to `service-worker.js`:

```javascript
// Track active investigations per tab
const activeInvestigations = new Map(); // tabId → { investigationId, pollInterval }

/**
 * Start polling for investigation results
 */
function startInvestigationPoll(tabId, investigationId) {
    // Clear any existing poll for this tab
    stopInvestigationPoll(tabId);

    const pollInterval = setInterval(async () => {
        try {
            const response = await fetch(
                `${API_BASE}/investigation/${investigationId}`,
                { method: "GET", cache: "no-cache" }
            );

            if (!response.ok) {
                console.error(`[ClickWise] Investigation poll failed: ${response.status}`);
                return;
            }

            const data = await response.json();

            // Send progress update to the investigation page
            try {
                await chrome.tabs.sendMessage(tabId, {
                    type: "INVESTIGATION_STATUS",
                    data: data
                });
            } catch (e) {
                // Tab might not have the listener yet
            }

            // Check for terminal state
            if (["COMPLETE", "FAILED", "TIMED_OUT"].includes(data.status)) {
                stopInvestigationPoll(tabId);

                // Handle completed investigation
                if (data.status === "COMPLETE") {
                    handleInvestigationComplete(tabId, data);
                } else {
                    handleInvestigationFailed(tabId, data);
                }
            }
        } catch (error) {
            console.error("[ClickWise] Investigation poll error:", error);
        }
    }, 2000); // 2-second interval per System Design §3.8

    activeInvestigations.set(tabId, { investigationId, pollInterval });

    // Safety timeout: stop polling after 35 seconds regardless
    setTimeout(() => {
        if (activeInvestigations.has(tabId)) {
            stopInvestigationPoll(tabId);
            handleInvestigationFailed(tabId, { status: "TIMED_OUT" });
        }
    }, 35000);
}

function stopInvestigationPoll(tabId) {
    const existing = activeInvestigations.get(tabId);
    if (existing) {
        clearInterval(existing.pollInterval);
        activeInvestigations.delete(tabId);
    }
}
```

### 3.3 Updated Navigation Handler

Modify the `chrome.webNavigation.onBeforeNavigate` handler:

```javascript
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    if (details.frameId !== 0) return;

    const url = details.url;
    const tabId = details.tabId;

    // Skip internal pages
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) return;

    // ... (existing whitelist and settings checks) ...

    // Analyze URL
    const analysis = await analyzeURL(url, true);

    // NEW: Check if investigation was triggered
    if (analysis.investigation && analysis.investigation.status === "PENDING") {
        console.log(`[ClickWise] 🔍 Investigation triggered: ${analysis.investigation.investigation_id}`);

        // Redirect to investigation interstitial page
        const investigationPageUrl = chrome.runtime.getURL('investigation.html') +
            '?url=' + encodeURIComponent(url) +
            '&investigation_id=' + encodeURIComponent(analysis.investigation.investigation_id) +
            '&initial_risk=' + analysis.max_risk_score;

        chrome.tabs.update(tabId, { url: investigationPageUrl });

        // Start polling for results
        startInvestigationPoll(tabId, analysis.investigation.investigation_id);
        return;
    }

    // Existing block logic (unchanged)
    if (analysis.max_risk_score >= settings.blockThreshold) {
        // ... existing block code ...
    }
});
```

### 3.4 Blocklist Polling Fix

**Current:** `setInterval(syncBlocklist, 4 * 1000)` — every 4 seconds, even when idle.

**Fix:** Use exponential backoff:

```javascript
let blocklistPollInterval = 10000; // Start at 10 seconds
const MAX_BLOCKLIST_POLL = 60000;  // Max 60 seconds

async function syncBlocklistWithBackoff() {
    await syncBlocklist();
    // If blocklist is empty or unchanged, slow down polling
    blocklistPollInterval = Math.min(blocklistPollInterval * 1.5, MAX_BLOCKLIST_POLL);
    setTimeout(syncBlocklistWithBackoff, blocklistPollInterval);
}

// Replace the setInterval with:
syncBlocklistWithBackoff();
```

---

## 4. Content Script Changes

### 4.1 Performance Fix: Don't Scan Every Link

**Current problem:** [`content.js`](../../../extension-clean/src/content/content.js) scans every link on every page, sending each to the backend. On pages with hundreds of links, this creates excessive API calls.

**Fix:** Only scan links on hover (lazy scanning):

```javascript
// BEFORE (scans all links on page load)
document.querySelectorAll('a[href]').forEach(link => analyzeLink(link));

// AFTER (scans on hover only)
document.addEventListener('mouseover', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || processed.has(link.href)) return;
    processed.add(link.href);
    analyzeLink(link);
}, { passive: true });
```

### 4.2 Investigation-Aware Badge

When a page is under investigation, the content script should show a subtle banner at the top of the page (before the interstitial redirects):

```javascript
function showInvestigationBanner() {
    const banner = document.createElement('div');
    banner.id = 'clickwise-investigation-banner';
    banner.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; z-index: 999999;
        background: linear-gradient(135deg, #1e40af, #3b82f6);
        color: white; padding: 8px 16px; text-align: center;
        font-family: -apple-system, sans-serif; font-size: 13px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
    banner.textContent = '🔍 ClickWise is investigating this page...';
    document.body.prepend(banner);
}
```

---

## 5. New Files

### 5.1 `investigation.html`

New web-accessible resource for the investigation interstitial and verdict display. This replaces `blocked.html` for investigated URLs.

**Add to manifest.json `web_accessible_resources`:**
```json
{
    "resources": ["blocked.html", "blocked.css", "blocked.js", "investigation.html", "investigation.css", "investigation.js"],
    "matches": ["<all_urls>"]
}
```

### 5.2 `investigation.js`

Handles:
- Parsing URL parameters (`url`, `investigation_id`, `initial_risk`)
- Listening for `INVESTIGATION_STATUS` messages from the service worker
- Updating the progress UI
- Rendering the verdict when `INVESTIGATION_COMPLETE` is received
- Handling Correct Path buttons (redirect to real site)
- Handling recovery workflow rendering
- "View full investigation trace" link (opens dashboard to investigation detail)

### 5.3 `investigation.css`

Styling for the investigation page — consistent with `blocked.css` design language but with blue (investigation) theming instead of red (blocked).

---

## 6. Manifest.json Updates

```jsonc
{
    "manifest_version": 3,
    "name": "ClickWise",                    // Changed from "SecureSentinel"
    "version": "4.0.0",                     // Version bump for investigation feature
    "description": "AI-powered phishing detection with autonomous investigation and safe redirection",

    // ... permissions stay the same ...

    "web_accessible_resources": [
        {
            "resources": [
                "blocked.html", "blocked.css", "blocked.js",
                "investigation.html", "investigation.css", "investigation.js"  // NEW
            ],
            "matches": ["<all_urls>"]
        }
    ]
}
```

---

## 7. Exposure Detection

### 7.1 Purpose

Determine if the user may have already entered sensitive information before ClickWise intervened. This drives the recovery workflow.

### 7.2 Logic

The content script can detect exposure by checking if the user interacted with sensitive form fields before the page was blocked:

```javascript
function detectExposure() {
    const forms = document.querySelectorAll('form');
    const exposure = { type: "NONE", fields: [] };

    for (const form of forms) {
        const inputs = form.querySelectorAll('input');
        for (const input of inputs) {
            const type = (input.type || '').toLowerCase();
            const name = (input.name || input.id || '').toLowerCase();

            // Check if the field has a value (user typed something)
            if (!input.value) continue;

            if (type === 'password' || name.includes('password') || name.includes('pwd')) {
                exposure.type = "CREDENTIAL";
                exposure.fields.push("password");
            }
            if (name.includes('otp') || name.includes('pin') || name.includes('mpin')) {
                exposure.type = "CREDENTIAL";
                exposure.fields.push("otp");
            }
            if (name.includes('card') || name.includes('credit') || name.includes('debit')) {
                exposure.type = "PAYMENT";
                exposure.fields.push("card_number");
            }
            if (name.includes('cvv') || name.includes('cvc')) {
                exposure.type = "PAYMENT";
                exposure.fields.push("cvv");
            }
            if (name.includes('aadhaar') || name.includes('pan') || name.includes('ssn')) {
                exposure.type = "PERSONAL_INFO";
                exposure.fields.push(name);
            }
        }
    }

    // PAYMENT overrides CREDENTIAL (more severe)
    return exposure;
}
```

**Important:** This detection happens **in the content script** before the page is replaced by the investigation interstitial. The exposure data is sent to the service worker and forwarded to the backend as part of the investigation context.

---

## 8. Test / Acceptance Checklist

### Flow

- [ ] Extension behaves identically to current behavior when backend returns no `investigation` field
- [ ] Investigation interstitial appears when backend returns `investigation.status == "PENDING"`
- [ ] Progress updates appear as polling returns new state/step data
- [ ] Verdict renders correctly for `PHISHING`, `SUSPICIOUS`, `LEGITIMATE`, `INCONCLUSIVE`
- [ ] Correct Path auto-redirect works (3-second countdown then navigate)
- [ ] Correct Path ask-user works (buttons appear, user choice is respected)
- [ ] Recovery guidance renders when `exposure_type != "NONE"`
- [ ] "View investigation trace" links to dashboard

### Badge

- [ ] Blue investigation badge appears during active investigation
- [ ] Red badge for confirmed phishing
- [ ] Green badge for verified legitimate
- [ ] Badge clears appropriately on new navigation

### Performance

- [ ] Blocklist polling uses exponential backoff (not flat 4-second)
- [ ] Content script scans links on hover, not on page load
- [ ] Investigation polling stops after terminal state
- [ ] Safety timeout (35s) prevents infinite polling

### Branding

- [ ] All "SecureSentinel" text replaced with "ClickWise"
- [ ] Manifest name is "ClickWise"
- [ ] Version bumped to 4.0.0

### Backward Compatibility

- [ ] Extension works with old backend (no investigation field) — pure block behavior
- [ ] Extension works with new backend — full investigation flow
- [ ] `blocked.html` still works for non-investigated blocks (blocklist matches)

---

## 9. Dependencies on Other Sub-PRDs

| Dependency | Sub-PRD | What This PRD Needs |
|---|---|---|
| Backend API | [03b](./03b-backend-api.md) | All API routes this extension calls |
| Detection ML | [03a](./03a-detection-ml.md) | Detection result format |
| Dashboard | [03d](./03d-dashboard-ui.md) | "View investigation trace" links to dashboard URL |
| Recovery | [03h](./03h-recovery-workflow.md) | Recovery workflow schema for rendering guidance |

## 10. What Breaks If This Contract Changes

| If This Changes... | These Break |
|---|---|
| `DetectionResult.investigation` field shape | Service Worker navigation handler, investigation page |
| Investigation polling response shape | Investigation page progress UI |
| `Verdict` schema | Investigation page verdict rendering |
| `CorrectPathResult` schema | Investigation page redirect buttons |
| `RecoveryWorkflow` schema | Investigation page recovery guidance |
| Badge color mapping | Popup stats display, user expectations |

---

*Next: [Dashboard / UI](./03d-dashboard-ui.md)*
