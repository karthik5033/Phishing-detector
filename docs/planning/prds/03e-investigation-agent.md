# Sub-PRD: Investigation Agent

> **Document:** `docs/planning/prds/03e-investigation-agent.md`
> **Owner:** Agent/Orchestration Lead (Member 1) + Browser Lead (Member 2)
> **Depends on:** [System Design](../02-system-design.md), [Detection ML](./03a-detection-ml.md), [Policy Engine](./03f-policy-engine.md)
> **Status:** Sub-PRD — must not contradict System Design

---

## Contracts Consumed

| Contract | Source | Section |
|---|---|---|
| `InvestigationObjective` schema | [System Design](../02-system-design.md#33-backend--investigation-agent-investigation-objective) | §3.3 |
| `ActionProposal` / `PolicyDecision` | [System Design](../02-system-design.md#34-investigation-agent--policy-engine-action-proposal--decision) | §3.4 |
| Risk Tier Table | [System Design](../02-system-design.md#4-risk-tier-table) | §4 |
| State Machine (all states + transitions) | [System Design](../02-system-design.md#5-investigation-state-machine) | §5 |
| `investigation_status` enum | [System Design](../02-system-design.md#13-enums-and-status-values) | §1.3 |
| Evidence Signal Catalog (14 signals) | [Detection ML](./03a-detection-ml.md#23-signal-catalog) | §2.3 |

## Contracts Produced

| Contract | Consumers |
|---|---|
| `EvidenceBundle` (complete set of evidence signals) | [Detection ML (Evidence Fusion)](./03a-detection-ml.md#2-evidence-fusion-meta-model) |
| `InvestigationTrace` (timestamped action log) | [Backend API](./03b-backend-api.md), [Dashboard](./03d-dashboard-ui.md) |
| Tool call outputs (DOM data, screenshots, form analysis) | Evidence Fusion, Threat Reasoner |

---

## Scope

### In Scope

1. Investigation Agent core — the autonomous loop that drives the investigation
2. Playwright browser management — two isolated contexts (investigation + trusted reference)
3. Constrained tool interface — the ONLY way the agent interacts with browsers
4. Bounded investigation planner — generates step plans within resource limits
5. Evidence signal collection from page analysis
6. Integration with Policy Engine (every action goes through it)
7. State machine implementation per System Design §5
8. Trace logging for every action

### Out of Scope

- Policy Engine rules and enforcement logic (see [Policy Engine](./03f-policy-engine.md))
- Evidence Fusion model training (see [Detection ML](./03a-detection-ml.md))
- Intent Inference and Correct Path resolution (see [Intent & Correct Path](./03g-intent-correct-path.md))
- API routes for investigation (see [Backend API](./03b-backend-api.md))

---

## 1. Architecture Overview

```
Investigation Orchestrator (Backend)
    │
    ├── creates InvestigationObjective
    │
    ▼
┌─────────────────────────────────────────────────┐
│              Investigation Agent                 │
│                                                  │
│  ┌──────────────┐    ┌───────────────────┐      │
│  │  LLM Planner │    │  State Machine    │      │
│  │  (Gemini)    │    │  Controller       │      │
│  └──────┬───────┘    └────────┬──────────┘      │
│         │                     │                  │
│         ▼                     ▼                  │
│  ┌──────────────────────────────────────┐       │
│  │         Tool Executor                 │       │
│  │  (dispatches tool calls through       │       │
│  │   Policy Engine before execution)     │       │
│  └──────────────┬───────────────────────┘       │
│                 │                                │
│      ┌──────────┼──────────┐                    │
│      ▼          ▼          ▼                    │
│  ┌───────┐ ┌────────┐ ┌──────────┐             │
│  │ Inv.  │ │Trusted │ │ Evidence │             │
│  │Browser│ │Ref.    │ │ Collector│             │
│  │(PW)   │ │Browser │ │          │             │
│  │       │ │(PW)    │ │          │             │
│  └───────┘ └────────┘ └──────────┘             │
│                                                  │
└─────────────────────────────────────────────────┘
    │
    ▼
  EvidenceBundle → Evidence Fusion → Verdict
```

### 1.1 Key Design Decisions

1. **The agent is NOT a freestyle LLM.** It operates within a structured loop: plan → execute step → collect evidence → repeat. The LLM plans which tools to call and in what order, but cannot do anything outside the tool interface.

2. **Every tool call goes through the Policy Engine.** There is no "fast path" that bypasses policy checks. Even observation-only tools like `screenshot` are verified (they'll always be ALLOW'd, but the check happens).

3. **The agent has a fixed tool vocabulary.** It cannot invent new tools, access the filesystem, make arbitrary network requests, or execute arbitrary code. The tool interface is closed.

4. **Two separate browser contexts.** The Investigation Browser loads the suspicious page. The Trusted Reference Browser loads the real site for comparison. They never share cookies, storage, or state.

5. **Hard resource bounds.** Max 15 steps, max 30 seconds, max 50 network requests. These are enforced by the state machine controller, not by the LLM's self-discipline.

---

## 2. Playwright Browser Management

### 2.1 Browser Lifecycle

```python
# backend/investigation/browser/sandbox.py

import asyncio
from playwright.async_api import async_playwright

class InvestigationSandbox:
    """
    Manages two isolated browser contexts for a single investigation.
    Created per-investigation, destroyed after completion.
    """

    def __init__(self, investigation_id: str, bounds: dict):
        self.investigation_id = investigation_id
        self.bounds = bounds
        self._playwright = None
        self._browser = None
        self._investigation_context = None
        self._reference_context = None
        self._investigation_page = None
        self._reference_page = None
        self._network_request_count = 0

    async def setup(self):
        """Initialize browser with security constraints."""
        self._playwright = await async_playwright().start()
        self._browser = await self._playwright.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-gpu',
                '--disable-dev-shm-usage',
                '--disable-extensions',
                '--disable-plugins',
                '--disable-downloads',        # No downloads
                '--disable-popup-blocking',   # Allow popups for inspection
            ]
        )

        # Investigation context — loads suspicious page
        self._investigation_context = await self._browser.new_context(
            java_script_enabled=True,
            bypass_csp=False,                  # Respect CSP
            ignore_https_errors=True,          # Phishing sites often have cert issues
            locale='en-IN',
            timezone_id='Asia/Kolkata',
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            # NO cookies, NO storage, NO credentials
        )

        # Trusted Reference context — loads real site for comparison
        self._reference_context = await self._browser.new_context(
            java_script_enabled=True,
            bypass_csp=False,
            locale='en-IN',
            timezone_id='Asia/Kolkata',
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        )

        # Set up network request tracking
        self._investigation_context.on("request", self._on_network_request)

        # Create pages
        self._investigation_page = await self._investigation_context.new_page()
        self._reference_page = await self._reference_context.new_page()

        # Set timeouts
        self._investigation_page.set_default_timeout(10000)  # 10s per operation
        self._reference_page.set_default_timeout(10000)

    def _on_network_request(self, request):
        """Track network requests against bounds."""
        self._network_request_count += 1
        if self._network_request_count > self.bounds.get('max_network_requests', 50):
            # Will be caught by the agent loop
            raise ResourceLimitExceeded("Network request limit exceeded")

    async def teardown(self):
        """Clean up all browser resources."""
        try:
            if self._investigation_page:
                await self._investigation_page.close()
            if self._reference_page:
                await self._reference_page.close()
            if self._investigation_context:
                await self._investigation_context.close()
            if self._reference_context:
                await self._reference_context.close()
            if self._browser:
                await self._browser.close()
            if self._playwright:
                await self._playwright.stop()
        except Exception as e:
            print(f"Sandbox teardown error: {e}")

    @property
    def investigation_page(self):
        return self._investigation_page

    @property
    def reference_page(self):
        return self._reference_page
```

### 2.2 Security Constraints

| Constraint | Implementation | Rationale |
|---|---|---|
| No user data in sandbox | Fresh context with no cookies/storage | Agent must never access user's real accounts |
| No downloads | `--disable-downloads` flag | Prevent malware downloads |
| Network request limit | Counter + `ResourceLimitExceeded` | Prevent infinite redirect chains |
| Domain restriction | Policy Engine checks before `navigate` | Agent stays within `allowed_domains` |
| No credential submission | Tier 4 BLOCK in Policy Engine | Agent must never type real passwords |
| Headless only | `headless=True` | No visual attack surface |
| Timeout per operation | 10s default timeout | Prevent hanging on slow/adversarial pages |

---

## 3. Constrained Tool Interface

### 3.1 Tool Catalog

This is the **complete, closed** set of tools available to the Investigation Agent. No other actions are possible.

#### Observation Tools (Tier 0 — always allowed)

| Tool Name | Parameters | Returns | Description |
|---|---|---|---|
| `screenshot` | `context: "investigation" \| "reference"` | Base64 PNG string | Captures viewport screenshot |
| `inspect_dom` | `context`, `selector?: string` | DOM structure summary (tag tree, classes, IDs) | Inspects DOM structure |
| `get_page_text` | `context` | Plain text content of the page | Extracts visible text |
| `get_page_url` | `context` | Current URL string | Returns the browser's current URL (detects redirects) |
| `get_page_title` | `context` | Title string | Returns `<title>` content |
| `extract_forms` | `context` | Array of form objects with fields, actions, methods | Finds all `<form>` elements and their inputs |
| `extract_links` | `context` | Array of `{text, href, isExternal}` | Extracts all `<a>` links |
| `extract_meta` | `context` | Object with meta tags, OG data, favicon URL | Extracts `<meta>` tags |
| `inspect_network` | `context` | Array of recent network requests (URL, method, status) | Returns network activity log |

#### Navigation Tools (Tier 1 — allowed in sandbox)

| Tool Name | Parameters | Returns | Description |
|---|---|---|---|
| `navigate` | `context`, `url: string` | Page loaded status | Navigates to URL (Policy Engine checks domain) |
| `scroll` | `context`, `direction: "up" \| "down"`, `amount: number` | New scroll position | Scrolls the page |
| `back` | `context` | Previous URL | Goes back in history |
| `wait` | `seconds: number` (max 5) | — | Waits for page to settle |

#### Interaction Tools (Tier 2 — restricted, logged)

| Tool Name | Parameters | Returns | Description |
|---|---|---|---|
| `click` | `context`, `selector: string` | Click result (navigated / popup / nothing) | Clicks an element |
| `type_text` | `context`, `selector: string`, `text: string` | — | Types text into a field (Policy Engine checks what's being typed) |
| `select_option` | `context`, `selector: string`, `value: string` | — | Selects a dropdown option |

#### Analysis Tools (Tier 0 — specialized evidence extraction)

| Tool Name | Parameters | Returns | Description |
|---|---|---|---|
| `detect_urgency_language` | `text: string` | `{score, patterns_found}` | Runs urgency pattern matching |
| `detect_fear_language` | `text: string` | `{score, patterns_found}` | Runs fear pattern matching |
| `detect_authority_language` | `text: string` | `{score, patterns_found}` | Runs authority pattern matching |
| `analyze_form_fields` | `form_data: object` | `{has_login, has_otp, has_card, has_pii, submission_url}` | Classifies form field types |
| `compare_domains` | `suspicious: string`, `claimed_brand: string` | `{mismatch_score, details}` | Compares domain against trusted registry |
| `compare_branding` | `screenshot_a: string`, `screenshot_b: string` | `{similarity_score}` | Compares visual similarity (Upgrade) |

### 3.2 Tool Executor

```python
# backend/investigation/browser/tools.py

class ToolExecutor:
    """
    Executes tool calls after Policy Engine approval.
    Every tool call follows this flow:
    1. Agent proposes action → ActionProposal
    2. Policy Engine evaluates → PolicyDecision
    3. If ALLOW: execute and return result
    4. If BLOCK: return blocked notification to agent
    5. If REQUIRE_APPROVAL: queue for human (or BLOCK if no human available)
    """

    def __init__(self, sandbox: InvestigationSandbox, policy_engine, trace_logger):
        self.sandbox = sandbox
        self.policy = policy_engine
        self.trace = trace_logger
        self._step_count = 0

    async def execute(self, tool_name: str, parameters: dict, rationale: str) -> dict:
        """Execute a tool call through the Policy Engine."""
        self._step_count += 1

        # 1. Build action proposal
        proposal = ActionProposal(
            action_type=tool_name,
            risk_tier=self._classify_risk_tier(tool_name, parameters),
            parameters=parameters,
            rationale=rationale
        )

        # 2. Check with Policy Engine
        decision = self.policy.evaluate(proposal)

        # 3. Log to trace
        trace_entry = {
            "step": self._step_count,
            "tool": tool_name,
            "parameters": parameters,
            "policy_decision": decision.decision,
            "policy_reason": decision.reason,
        }

        # 4. Execute or block
        if decision.decision == "BLOCK":
            trace_entry["result"] = "BLOCKED"
            self.trace.log(trace_entry)
            return {"status": "blocked", "reason": decision.reason}

        if decision.decision == "REQUIRE_APPROVAL":
            # For hackathon: treat as BLOCK (no human-in-the-loop UI yet)
            trace_entry["result"] = "BLOCKED_NEEDS_APPROVAL"
            self.trace.log(trace_entry)
            return {"status": "blocked", "reason": "Requires human approval (not available)"}

        # 5. Execute the tool
        start_time = asyncio.get_event_loop().time()
        try:
            result = await self._dispatch(tool_name, parameters)
            duration_ms = int((asyncio.get_event_loop().time() - start_time) * 1000)
            trace_entry["result"] = "success"
            trace_entry["duration_ms"] = duration_ms
            self.trace.log(trace_entry)
            return {"status": "success", "data": result}
        except Exception as e:
            trace_entry["result"] = f"error: {str(e)}"
            self.trace.log(trace_entry)
            return {"status": "error", "error": str(e)}

    async def _dispatch(self, tool_name: str, params: dict):
        """Route tool call to implementation."""
        context = params.get("context", "investigation")
        page = (self.sandbox.investigation_page
                if context == "investigation"
                else self.sandbox.reference_page)

        match tool_name:
            case "screenshot":
                return await self._screenshot(page)
            case "inspect_dom":
                return await self._inspect_dom(page, params.get("selector"))
            case "get_page_text":
                return await self._get_page_text(page)
            case "get_page_url":
                return page.url
            case "get_page_title":
                return await page.title()
            case "extract_forms":
                return await self._extract_forms(page)
            case "extract_links":
                return await self._extract_links(page)
            case "extract_meta":
                return await self._extract_meta(page)
            case "inspect_network":
                return self.sandbox.get_network_log(context)
            case "navigate":
                await page.goto(params["url"], wait_until="domcontentloaded", timeout=10000)
                return {"url": page.url, "title": await page.title()}
            case "scroll":
                direction = params.get("direction", "down")
                amount = params.get("amount", 500)
                delta = amount if direction == "down" else -amount
                await page.mouse.wheel(0, delta)
                return {"scrolled": delta}
            case "back":
                await page.go_back()
                return {"url": page.url}
            case "wait":
                seconds = min(params.get("seconds", 1), 5)
                await asyncio.sleep(seconds)
                return {"waited": seconds}
            case "click":
                await page.click(params["selector"], timeout=5000)
                return {"clicked": params["selector"], "url_after": page.url}
            case "type_text":
                await page.fill(params["selector"], params["text"])
                return {"typed": True}
            case "select_option":
                await page.select_option(params["selector"], params["value"])
                return {"selected": params["value"]}
            # Analysis tools (no browser interaction)
            case "detect_urgency_language":
                from backend.detection.language_analysis import detect_urgency
                return detect_urgency(params["text"])
            case "detect_fear_language":
                from backend.detection.language_analysis import detect_fear
                return detect_fear(params["text"])
            case "detect_authority_language":
                from backend.detection.language_analysis import detect_authority
                return detect_authority(params["text"])
            case "analyze_form_fields":
                return self._analyze_form_fields(params["form_data"])
            case "compare_domains":
                from backend.trusted_sources.registry import compare_domains
                return compare_domains(params["suspicious"], params["claimed_brand"])
            case "compare_branding":
                # Upgrade feature
                return {"similarity_score": 0.0, "available": False}
            case _:
                raise ValueError(f"Unknown tool: {tool_name}")

    def _classify_risk_tier(self, tool_name: str, params: dict) -> str:
        """Agent's self-assessment of risk tier."""
        TIER_MAP = {
            # Tier 0: OBSERVATION
            "screenshot": "OBSERVATION", "inspect_dom": "OBSERVATION",
            "get_page_text": "OBSERVATION", "get_page_url": "OBSERVATION",
            "get_page_title": "OBSERVATION", "extract_forms": "OBSERVATION",
            "extract_links": "OBSERVATION", "extract_meta": "OBSERVATION",
            "inspect_network": "OBSERVATION",
            "detect_urgency_language": "OBSERVATION", "detect_fear_language": "OBSERVATION",
            "detect_authority_language": "OBSERVATION", "analyze_form_fields": "OBSERVATION",
            "compare_domains": "OBSERVATION", "compare_branding": "OBSERVATION",
            # Tier 1: REVERSIBLE
            "navigate": "REVERSIBLE", "scroll": "REVERSIBLE",
            "back": "REVERSIBLE", "wait": "REVERSIBLE",
            # Tier 2: SENSITIVE
            "click": "SENSITIVE", "type_text": "SENSITIVE", "select_option": "SENSITIVE",
        }
        return TIER_MAP.get(tool_name, "SENSITIVE")
```

### 3.3 Tool Implementation Details

#### `extract_forms` — Critical for credential harvesting detection

```python
async def _extract_forms(self, page) -> list:
    """Extract all forms with detailed field analysis."""
    return await page.evaluate("""
        () => {
            return Array.from(document.querySelectorAll('form')).map(form => {
                const inputs = Array.from(form.querySelectorAll('input, select, textarea'));
                return {
                    action: form.action || '',
                    method: (form.method || 'GET').toUpperCase(),
                    id: form.id || null,
                    fields: inputs.map(input => ({
                        tag: input.tagName.toLowerCase(),
                        type: input.type || 'text',
                        name: input.name || input.id || '',
                        placeholder: input.placeholder || '',
                        required: input.required,
                        autocomplete: input.autocomplete || '',
                        maxLength: input.maxLength > 0 ? input.maxLength : null,
                        pattern: input.pattern || null,
                        hasValue: !!input.value,
                    })),
                    hasSubmitButton: !!form.querySelector('button[type="submit"], input[type="submit"]'),
                    isExternal: (() => {
                        try {
                            const formUrl = new URL(form.action, window.location.href);
                            return formUrl.hostname !== window.location.hostname;
                        } catch { return false; }
                    })()
                };
            });
        }
    """)
```

#### `_analyze_form_fields` — Classifies forms for evidence signals

```python
def _analyze_form_fields(self, form_data: dict) -> dict:
    """Classify form fields to produce evidence signals."""
    result = {
        "has_login": False,
        "has_otp": False,
        "has_card": False,
        "has_pii": False,
        "submission_url": form_data.get("action", ""),
        "is_external_submission": form_data.get("isExternal", False),
    }

    password_indicators = {'password', 'pwd', 'pass', 'passwd'}
    otp_indicators = {'otp', 'pin', 'mpin', 'verification', 'code', '2fa'}
    card_indicators = {'card', 'credit', 'debit', 'cvv', 'cvc', 'expiry', 'cardnumber'}
    pii_indicators = {'aadhaar', 'aadhar', 'pan', 'ssn', 'passport', 'voter', 'driving'}

    for field in form_data.get("fields", []):
        field_type = (field.get("type") or "").lower()
        field_name = (field.get("name") or "").lower()
        field_placeholder = (field.get("placeholder") or "").lower()
        combined = f"{field_type} {field_name} {field_placeholder}"

        if field_type == "password" or any(kw in combined for kw in password_indicators):
            result["has_login"] = True
        if any(kw in combined for kw in otp_indicators):
            result["has_otp"] = True
        if any(kw in combined for kw in card_indicators):
            result["has_card"] = True
        if any(kw in combined for kw in pii_indicators):
            result["has_pii"] = True

    return result
```

---

## 4. LLM-Driven Investigation Planner

### 4.1 Overview

The Investigation Agent uses Gemini to generate a bounded investigation plan based on the objective and initial observations. The LLM does NOT have free-form control — it produces structured JSON plans.

### 4.2 System Prompt

```python
INVESTIGATION_SYSTEM_PROMPT = """
You are an automated phishing investigation agent for ClickWise.
Your job is to determine whether a suspicious webpage is a phishing site.

CONSTRAINTS:
- You MUST produce plans as a JSON array of tool calls
- You can ONLY use the tools listed below
- You MUST NOT exceed {max_steps} total steps
- You MUST NOT navigate outside these domains: {allowed_domains}
- You MUST NOT type any real credentials, passwords, or payment info
- You MUST NOT submit any forms with sensitive data
- You CANNOT make arbitrary HTTP requests — only navigate in the browser

AVAILABLE TOOLS:
{tool_descriptions}

Your plan should follow this general strategy:
1. OBSERVE: Take screenshot, inspect DOM, get page text
2. ANALYZE: Extract forms, links, check for urgency/fear language
3. COMPARE: If a brand is claimed, navigate the reference browser to the real site
4. VERIFY: Compare the suspicious page structure with the real site
5. CONCLUDE: Produce evidence signals based on findings

Return a JSON array of steps, each with:
{{
    "tool": "tool_name",
    "parameters": {{}},
    "rationale": "why this step helps determine phishing"
}}
"""
```

### 4.3 Plan Generation

```python
async def generate_plan(self, objective: InvestigationObjective, observations: dict) -> list:
    """Generate a bounded investigation plan using Gemini."""
    prompt = f"""
    Target URL: {objective.target_url}
    Claimed Brand: {objective.claimed_brand or "Unknown"}
    User Context: {json.dumps(objective.user_context)}

    Initial Observations:
    - Page Title: {observations.get('title', 'N/A')}
    - Page URL (after load): {observations.get('url', 'N/A')}
    - Text Preview: {observations.get('text_preview', 'N/A')[:500]}
    - Forms Found: {observations.get('forms_count', 0)}
    - Links Found: {observations.get('links_count', 0)}

    Generate an investigation plan with at most {objective.bounds['max_steps'] - 3} steps
    (3 steps already used for initial observation).
    Focus on determining: Is this page phishing? What brand is it impersonating?
    """

    response = await self.llm.generate(
        system=INVESTIGATION_SYSTEM_PROMPT.format(
            max_steps=objective.bounds['max_steps'],
            allowed_domains=objective.bounds['allowed_domains'],
            tool_descriptions=self._format_tool_descriptions()
        ),
        prompt=prompt,
        response_format="json"
    )

    # Parse and validate the plan
    plan = json.loads(response)

    # Enforce bounds
    max_remaining = objective.bounds['max_steps'] - 3  # 3 used for observation
    plan = plan[:max_remaining]

    # Validate each step has valid tool name
    valid_tools = set(self.tool_executor.TIER_MAP.keys())
    plan = [step for step in plan if step.get('tool') in valid_tools]

    return plan
```

### 4.4 Replanning

If a step fails (element not found, navigation error, timeout), the agent can replan:

```python
async def replan(self, objective, remaining_steps, failed_step, error, collected_evidence):
    """Generate a revised plan after a step failure."""
    prompt = f"""
    The investigation hit an issue.
    Failed step: {json.dumps(failed_step)}
    Error: {error}
    Evidence collected so far: {json.dumps(collected_evidence)}
    Remaining step budget: {remaining_steps}

    Generate a revised plan to continue the investigation with the remaining budget.
    Do NOT retry the exact same step. Adapt the approach.
    """

    # ... similar to generate_plan but with failure context
```

**Replan limit:** Maximum 3 replans per investigation. After 3, the investigation transitions to `FAILED`.

---

## 5. Agent Core Loop

### 5.1 Main Investigation Loop

```python
# backend/investigation/agent.py

class InvestigationAgent:
    """
    The autonomous investigation agent.
    Drives the state machine and executes investigation plans.
    """

    def __init__(self, sandbox, tool_executor, policy_engine, llm_service, trace_logger):
        self.sandbox = sandbox
        self.tools = tool_executor
        self.policy = policy_engine
        self.llm = llm_service
        self.trace = trace_logger
        self.evidence_bundle = EvidenceBundle()
        self.replan_count = 0
        self.step_count = 0

    async def run(self, objective: InvestigationObjective) -> EvidenceBundle:
        """
        Execute the full investigation and return collected evidence.
        Raises InvestigationTimeout if max_time exceeded.
        Raises InvestigationFailed if unrecoverable error.
        """
        start_time = asyncio.get_event_loop().time()

        try:
            # PHASE 1: OBSERVING — collect initial page data
            self.trace.transition("OBSERVING")
            observations = await self._observe(objective)

            # PHASE 2: ASSESSING — generate investigation plan
            self.trace.transition("ASSESSING")
            plan = await self._plan(objective, observations)

            # PHASE 3: INVESTIGATING — execute plan steps
            self.trace.transition("INVESTIGATING")
            await self._execute_plan(objective, plan, start_time)

            # PHASE 4: VERIFYING — check evidence completeness
            self.trace.transition("VERIFYING")
            if self._evidence_insufficient():
                # Go back to investigating with more steps
                if self.step_count < objective.bounds['max_steps']:
                    supplementary_plan = await self._plan_supplementary(objective)
                    self.trace.transition("INVESTIGATING")
                    await self._execute_plan(objective, supplementary_plan, start_time)
                    self.trace.transition("VERIFYING")

            return self.evidence_bundle

        except asyncio.TimeoutError:
            self.trace.transition("TIMED_OUT")
            raise InvestigationTimeout(self.evidence_bundle)

    async def _observe(self, objective) -> dict:
        """Phase 1: Load the page and collect baseline observations."""
        # Navigate to the suspicious URL
        nav_result = await self.tools.execute(
            "navigate",
            {"context": "investigation", "url": objective.target_url},
            "Loading suspicious page for initial observation"
        )

        # Take screenshot
        await self.tools.execute("screenshot", {"context": "investigation"}, "Initial screenshot")

        # Get page content
        text_result = await self.tools.execute("get_page_text", {"context": "investigation"}, "Extracting page text")
        title_result = await self.tools.execute("get_page_title", {"context": "investigation"}, "Getting page title")

        # Extract forms and links
        forms_result = await self.tools.execute("extract_forms", {"context": "investigation"}, "Finding forms")
        links_result = await self.tools.execute("extract_links", {"context": "investigation"}, "Finding links")

        # Check actual URL (in case of redirects)
        actual_url = await self.tools.execute("get_page_url", {"context": "investigation"}, "Checking for redirects")

        self.step_count += 6  # observation steps

        return {
            "url": actual_url.get("data", objective.target_url),
            "title": title_result.get("data", ""),
            "text_preview": str(text_result.get("data", ""))[:1000],
            "forms": forms_result.get("data", []),
            "forms_count": len(forms_result.get("data", [])),
            "links": links_result.get("data", []),
            "links_count": len(links_result.get("data", [])),
        }

    async def _execute_plan(self, objective, plan, start_time):
        """Execute plan steps one by one, checking bounds."""
        for i, step in enumerate(plan):
            # Check time bound
            elapsed = asyncio.get_event_loop().time() - start_time
            if elapsed >= objective.bounds['max_time_seconds']:
                raise asyncio.TimeoutError("Investigation time limit exceeded")

            # Check step bound
            if self.step_count >= objective.bounds['max_steps']:
                self.trace.log({"event": "step_limit_reached", "step": self.step_count})
                break

            # Execute the step
            result = await self.tools.execute(
                step["tool"],
                step.get("parameters", {}),
                step.get("rationale", "")
            )

            self.step_count += 1

            # Collect evidence from the result
            self.trace.transition("COLLECTING_EVIDENCE")
            await self._collect_evidence_from_step(step, result)
            self.trace.transition("INVESTIGATING")

            # Handle step failure
            if result.get("status") == "error":
                self.replan_count += 1
                if self.replan_count > 3:
                    raise InvestigationFailed("Max replans exceeded")

                self.trace.transition("REPLANNING")
                remaining_steps = objective.bounds['max_steps'] - self.step_count
                new_plan = await self.replan(
                    objective, remaining_steps, step,
                    result.get("error"), self.evidence_bundle.to_dict()
                )
                self.trace.transition("INVESTIGATING")
                # Execute the new plan (recursive, but bounded by step count)
                await self._execute_plan(objective, new_plan, start_time)
                return  # Don't continue old plan

    async def _collect_evidence_from_step(self, step, result):
        """Extract evidence signals from a tool call result."""
        if result.get("status") != "success":
            return

        data = result.get("data", {})
        tool = step["tool"]

        # Map tool results to evidence signals
        if tool == "extract_forms" and isinstance(data, list):
            for form in data:
                analysis = self.tools._analyze_form_fields(form)
                if analysis["has_login"]:
                    self.evidence_bundle.add_signal("dom_login_form", 0.90, 0.99, "investigation_agent")
                if analysis["has_otp"]:
                    self.evidence_bundle.add_signal("dom_otp_field", 0.85, 0.99, "investigation_agent")
                if analysis["has_card"]:
                    self.evidence_bundle.add_signal("dom_card_field", 0.90, 0.99, "investigation_agent")
                if analysis["has_pii"]:
                    self.evidence_bundle.add_signal("dom_pii_field", 0.85, 0.95, "investigation_agent")
                if analysis["is_external_submission"]:
                    self.evidence_bundle.add_signal("external_submission", 0.90, 0.95, "investigation_agent")

        elif tool == "detect_urgency_language":
            self.evidence_bundle.add_signal("urgency_language", data.get("score", 0), 0.85, "investigation_agent")

        elif tool == "detect_fear_language":
            self.evidence_bundle.add_signal("fear_language", data.get("score", 0), 0.85, "investigation_agent")

        elif tool == "detect_authority_language":
            self.evidence_bundle.add_signal("authority_language", data.get("score", 0), 0.85, "investigation_agent")

        elif tool == "compare_domains":
            self.evidence_bundle.add_signal("domain_mismatch", data.get("mismatch_score", 0), 0.99, "investigation_agent")
            self.evidence_bundle.add_signal("brand_impersonation", data.get("mismatch_score", 0), 0.90, "investigation_agent")

        elif tool == "compare_branding":
            if data.get("available"):
                self.evidence_bundle.add_signal("visual_similarity", data.get("similarity_score", 0), 0.80, "investigation_agent")

        elif tool == "inspect_network":
            redirects = [r for r in data if r.get("status", 0) in [301, 302, 303, 307, 308]]
            depth = len(redirects) / max(len(data), 1)
            self.evidence_bundle.add_signal("redirect_chain_depth", min(depth, 1.0), 0.70, "investigation_agent")

    def _evidence_insufficient(self) -> bool:
        """Check if we have enough evidence for a verdict."""
        signals = self.evidence_bundle.signals
        # Need at least 3 different signals
        if len(signals) < 3:
            return True
        # Need at least one form-related signal (for credential/payment phishing)
        form_signals = {"dom_login_form", "dom_otp_field", "dom_card_field", "dom_pii_field"}
        has_form_signal = any(s.name in form_signals for s in signals)
        # Need domain comparison
        has_domain_signal = any(s.name in {"domain_mismatch", "brand_impersonation"} for s in signals)
        return not (has_form_signal or has_domain_signal)
```

---

## 6. Evidence Bundle

```python
# backend/investigation/evidence/collector.py

from dataclasses import dataclass, field
from typing import List

@dataclass
class EvidenceSignal:
    """A single evidence signal matching the canonical schema from System Design §3.5"""
    name: str           # Must be from Signal Catalog (Detection ML PRD §2.3)
    score: float        # 0.0–1.0
    confidence: float   # 0.0–1.0
    source: str         # "detection_engine" | "investigation_agent" | "threat_intel"
    detail: str = ""

@dataclass
class EvidenceBundle:
    """Complete set of evidence signals for one investigation."""
    signals: List[EvidenceSignal] = field(default_factory=list)

    def add_signal(self, name: str, score: float, confidence: float, source: str, detail: str = ""):
        """Add or update a signal. If signal with same name exists, keep the higher score."""
        existing = next((s for s in self.signals if s.name == name), None)
        if existing:
            if score > existing.score:
                existing.score = score
                existing.confidence = confidence
                existing.detail = detail
        else:
            self.signals.append(EvidenceSignal(name, score, confidence, source, detail))

    def to_dict(self) -> dict:
        """Convert to dict matching System Design §3.5 EvidenceBundle schema."""
        return {
            "signals": [
                {
                    "name": s.name,
                    "score": s.score,
                    "confidence": s.confidence,
                    "source": s.source,
                    "detail": s.detail,
                }
                for s in self.signals
            ]
        }
```

---

## 7. Trusted Reference Browser Usage

### 7.1 When to Use

The Trusted Reference Browser is activated when:
1. The Investigation Agent identifies a `claimed_brand` (from URL structure, page content, or logos)
2. The Trusted Source Registry returns a known official URL for that brand
3. The agent compares the suspicious page with the real page

### 7.2 Comparison Flow

```python
async def _compare_with_reference(self, claimed_brand, trusted_url):
    """Load the real site and compare with the suspicious page."""
    # Navigate reference browser to the real site
    await self.tools.execute(
        "navigate",
        {"context": "reference", "url": trusted_url},
        f"Loading real {claimed_brand} site for comparison"
    )

    # Take reference screenshot
    await self.tools.execute("screenshot", {"context": "reference"}, "Reference site screenshot")

    # Extract reference forms
    ref_forms = await self.tools.execute("extract_forms", {"context": "reference"}, "Reference site forms")

    # Compare domains
    suspicious_url = await self.tools.execute("get_page_url", {"context": "investigation"}, "Get suspicious URL")
    domain_comparison = await self.tools.execute(
        "compare_domains",
        {"suspicious": suspicious_url["data"], "claimed_brand": claimed_brand},
        "Compare domains against trusted registry"
    )

    # Compare branding (if visual similarity is available)
    # ... (upgrade feature)
```

---

## 8. Trace Logger

```python
# backend/investigation/trace_logger.py

class TraceLogger:
    """Logs every action for the InvestigationTrace."""

    def __init__(self, investigation_id: str, db_session):
        self.investigation_id = investigation_id
        self.db = db_session
        self._entries = []
        self._current_state = "PENDING"

    def transition(self, new_state: str):
        """Log a state transition."""
        self._current_state = new_state
        self.log({
            "state_transition": f"{self._current_state} → {new_state}",
            "action": "state_change",
        })
        # Update DB
        self.db.query(Investigation).filter_by(id=self.investigation_id).update({"status": new_state})
        self.db.commit()

    def log(self, entry: dict):
        """Log a trace entry."""
        entry["timestamp"] = datetime.utcnow().isoformat() + "Z"
        entry["state"] = self._current_state
        self._entries.append(entry)

        # Persist to DB
        trace_entry = InvestigationTraceEntry(
            investigation_id=self.investigation_id,
            state=self._current_state,
            action=entry.get("action") or entry.get("tool", "unknown"),
            result=entry.get("result", ""),
            duration_ms=entry.get("duration_ms"),
            details_json=json.dumps(entry),
        )
        self.db.add(trace_entry)
        self.db.commit()

    def get_trace(self) -> list:
        return self._entries
```

---

## 9. Test / Acceptance Checklist

### Browser Management

- [ ] Playwright launches headless Chromium successfully
- [ ] Two separate browser contexts created (investigation + reference)
- [ ] No cookies, storage, or credentials in either context
- [ ] Contexts are fully isolated from each other
- [ ] Browser cleaned up after investigation (no leaked processes)
- [ ] Network request limit enforced (50)
- [ ] Per-operation timeout enforced (10s)

### Tool Interface

- [ ] All 22 tools in the catalog work correctly
- [ ] Every tool call goes through Policy Engine before execution
- [ ] Blocked tools return informative error to the agent
- [ ] Tool results are correctly mapped to evidence signals
- [ ] Unknown tool names raise `ValueError`

### Investigation Loop

- [ ] Agent completes investigation within 30 seconds
- [ ] Agent completes investigation within 15 steps
- [ ] Agent produces at least 3 evidence signals per investigation
- [ ] Replanning works (max 3 retries)
- [ ] Timeout triggers graceful `TIMED_OUT` state (not crash)
- [ ] Failed steps don't crash the investigation
- [ ] Evidence bundle conforms to System Design §3.5 schema

### LLM Planning

- [ ] Generated plans contain only valid tool names
- [ ] Plans respect step budget (max_steps - observation_steps)
- [ ] Plans don't include prohibited actions (submit_credentials, etc.)
- [ ] Plans are JSON-parseable

### Trace Logging

- [ ] Every state transition is logged
- [ ] Every tool call is logged with duration
- [ ] Policy decisions are logged
- [ ] Trace is persisted to DB
- [ ] Trace is retrievable via `GET /api/v1/investigation/{id}/trace`

### Benchmark Scenarios

- [ ] Agent correctly identifies SBI KYC phishing demo page
- [ ] Agent correctly identifies courier payment scam demo page
- [ ] Agent correctly identifies scholarship phishing demo page
- [ ] Agent correctly identifies legitimate SBI page as safe
- [ ] Agent doesn't type credentials into any form
- [ ] Agent doesn't submit any form with sensitive fields

---

## 10. Dependencies on Other Sub-PRDs

| Dependency | Sub-PRD | What This PRD Needs |
|---|---|---|
| Policy Engine | [03f](./03f-policy-engine.md) | Every ActionProposal evaluated by Policy Engine |
| Detection ML | [03a](./03a-detection-ml.md) | Signal Catalog names, Evidence Fusion input format |
| Backend API | [03b](./03b-backend-api.md) | Investigation Orchestrator creates and manages investigations |
| Intent & Correct Path | [03g](./03g-intent-correct-path.md) | After evidence collected, Intent Inference determines user's goal |

## 11. What Breaks If This Contract Changes

| If This Changes... | These Break |
|---|---|
| Tool catalog (adding/removing tools) | LLM system prompt, Policy Engine rules, evidence collection |
| Evidence signal names | Evidence Fusion (expects specific names), Dashboard (displays them) |
| EvidenceBundle schema | Evidence Fusion input, DB storage |
| State machine states/transitions | Backend API status reporting, Extension polling |
| Investigation bounds format | Orchestrator, config.py, all callers |

---

*Next: [Policy Engine](./03f-policy-engine.md)*
