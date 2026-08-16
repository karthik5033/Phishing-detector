# Sub-PRD: Intent Inference & Correct Path

> **Document:** `docs/planning/prds/03g-intent-correct-path.md`
> **Owner:** Vision/NLP Lead (Member 4)
> **Depends on:** [System Design](../02-system-design.md), [Detection ML](./03a-detection-ml.md)
> **Status:** Sub-PRD — must not contradict System Design

---

## Contracts Consumed

| Contract | Source | Section |
|---|---|---|
| `InferredIntent` / `CorrectPathResult` schemas | [System Design](../02-system-design.md#37-threat-reasoner--intent-inference--correct-path) | §3.7 |
| `Verdict` schema | [System Design](../02-system-design.md#36-evidence-fusion--threat-reasoner-verdict-generation) | §3.6 |
| `trust_source` enum | [System Design](../02-system-design.md#13-enums-and-status-values) | §1.3 |
| Auto-redirect threshold rules | [System Design](../02-system-design.md#37-threat-reasoner--intent-inference--correct-path) | §3.7 |
| Trusted Source Registry data | Kiro's seed task → `backend/data/trusted_sources_seed.json` | — |

## Contracts Produced

| Contract | Consumers |
|---|---|
| `InferredIntent` object | [Backend API](./03b-backend-api.md) (includes in investigation response) |
| `CorrectPathResult` object | [Extension](./03c-extension.md) (renders redirect), [Dashboard](./03d-dashboard-ui.md) (displays in verdict) |

---

## Scope

### In Scope

1. Intent Inference — determine what the user was trying to do
2. Correct Path Resolution — find the legitimate destination
3. Trusted Source Registry — queryable database of org-to-domain mappings
4. Confidence scoring and auto-redirect decision logic

### Out of Scope

- Investigation Agent (see [03e](./03e-investigation-agent.md))
- Evidence collection (see [03e](./03e-investigation-agent.md))
- Recovery workflows (see [03h](./03h-recovery-workflow.md))
- Extension UI for Correct Path rendering (see [03c](./03c-extension.md))

---

## 1. Intent Inference

### 1.1 Purpose

When ClickWise determines a page is phishing, it needs to understand **what the user was actually trying to do** so it can redirect them to the real destination. Intent inference answers: "The user was trying to access [organization]'s [service]."

### 1.2 Input Sources (priority order)

The system has up to 4 sources of intent information, ordered by reliability:

| Priority | Source | Reliability | Example |
|---|---|---|---|
| 1 | **Search query** (from referrer) | HIGH | User searched "sbi net banking" → intent = SBI online banking |
| 2 | **Message text** (if URL came from SMS/chat) | MEDIUM | "Click here to verify your Paytm KYC" → intent = Paytm KYC |
| 3 | **URL structure** (domain, path, keywords) | MEDIUM | `sbi-login-verify.example.com/kyc` → intent = SBI KYC |
| 4 | **Page content** (from Investigation Agent) | LOW | Page says "State Bank of India — Online Banking" → intent = SBI banking |

### 1.3 Implementation

```python
# backend/intent/inference.py

from dataclasses import dataclass
from typing import Optional
import re
from urllib.parse import urlparse, parse_qs
from backend.trusted_sources.registry import TrustedSourceRegistry

@dataclass
class InferredIntent:
    organization: str          # "State Bank of India"
    task: str                  # "online banking login"
    confidence: float          # 0.0–1.0
    source: str                # search_query | message_text | url_structure | llm_inference
    reasoning: str             # human-readable explanation

class IntentInferenceEngine:
    """
    Determines the user's original intent from available context.
    Uses a priority-based approach — highest-confidence source wins.
    """

    def __init__(self, registry: TrustedSourceRegistry, llm_service=None):
        self.registry = registry
        self.llm = llm_service

    async def infer(
        self,
        verdict: dict,
        user_context: dict
    ) -> InferredIntent:
        """
        Infer user intent from all available sources.
        Returns the highest-confidence inference.
        """
        candidates = []

        # Source 1: Search query
        search_query = user_context.get("search_query")
        if search_query:
            intent = self._infer_from_search_query(search_query)
            if intent:
                candidates.append(intent)

        # Source 2: Message text
        message_text = user_context.get("message_text")
        if message_text:
            intent = self._infer_from_message(message_text)
            if intent:
                candidates.append(intent)

        # Source 3: URL structure
        target_url = user_context.get("target_url", "")
        claimed_org = verdict.get("claimed_organization")
        if target_url:
            intent = self._infer_from_url(target_url, claimed_org)
            if intent:
                candidates.append(intent)

        # Source 4: LLM inference (lowest priority, used when others fail)
        if not candidates and self.llm:
            intent = await self._infer_from_llm(verdict, user_context)
            if intent:
                candidates.append(intent)

        # Return highest confidence candidate
        if not candidates:
            return InferredIntent(
                organization="Unknown",
                task="unknown",
                confidence=0.0,
                source="none",
                reasoning="Could not determine user intent from available context"
            )

        candidates.sort(key=lambda x: x.confidence, reverse=True)
        return candidates[0]
```

### 1.4 Search Query Inference

```python
    def _infer_from_search_query(self, query: str) -> Optional[InferredIntent]:
        """
        Extract intent from a search query.
        Most reliable source — user explicitly typed what they want.
        """
        query_lower = query.lower().strip()

        # Try to match against known organizations in the registry
        matches = self.registry.search_by_keywords(query_lower)

        if matches:
            best_match = matches[0]  # Highest relevance
            # Determine the task from remaining query words
            task = self._extract_task_from_query(query_lower, best_match.name)
            return InferredIntent(
                organization=best_match.name,
                task=task or "access service",
                confidence=0.90,
                source="search_query",
                reasoning=f"User searched for '{query}' — matched organization '{best_match.name}'"
            )

        return None

    def _extract_task_from_query(self, query: str, org_name: str) -> str:
        """Extract the task/action from the query after removing the org name."""
        # Remove org name variations from query
        remaining = query.lower()
        for word in org_name.lower().split():
            remaining = remaining.replace(word, "").strip()

        # Map remaining words to task descriptions
        TASK_KEYWORDS = {
            "login": "login",
            "log in": "login",
            "sign in": "login",
            "net banking": "online banking login",
            "online banking": "online banking login",
            "internet banking": "online banking login",
            "balance": "check account balance",
            "statement": "view account statement",
            "transfer": "fund transfer",
            "upi": "UPI payment",
            "kyc": "KYC verification",
            "register": "new account registration",
            "password": "password reset",
            "forgot": "password recovery",
            "customer care": "customer support",
            "helpline": "customer support",
            "track": "order tracking",
            "status": "check status",
            "apply": "submit application",
            "download": "download document",
        }

        for keyword, task in TASK_KEYWORDS.items():
            if keyword in remaining:
                return task

        return "access service"
```

### 1.5 URL Structure Inference

```python
    def _infer_from_url(self, url: str, claimed_org: str = None) -> Optional[InferredIntent]:
        """
        Extract intent from URL structure.
        Domain keywords, path segments, and query parameters.
        """
        try:
            parsed = urlparse(url)
            hostname = parsed.hostname or ""
            path = parsed.path or ""
            combined = f"{hostname} {path}".lower()

            # Try matching organization from URL
            org = claimed_org
            if not org:
                org_match = self.registry.match_from_url(url)
                if org_match:
                    org = org_match.name

            if not org:
                return None

            # Extract task from URL path
            task = "access service"
            PATH_TASK_MAP = {
                "login": "login",
                "signin": "login",
                "auth": "authentication",
                "kyc": "KYC verification",
                "verify": "verification",
                "payment": "payment",
                "pay": "payment",
                "transfer": "fund transfer",
                "account": "account access",
                "register": "registration",
                "forgot": "password recovery",
                "reset": "password reset",
                "profile": "profile management",
                "support": "customer support",
            }

            for keyword, task_name in PATH_TASK_MAP.items():
                if keyword in combined:
                    task = task_name
                    break

            return InferredIntent(
                organization=org,
                task=task,
                confidence=0.70,
                source="url_structure",
                reasoning=f"URL contains references to '{org}' with path suggesting '{task}'"
            )
        except Exception:
            return None
```

### 1.6 LLM Inference (Fallback)

```python
    async def _infer_from_llm(self, verdict: dict, user_context: dict) -> Optional[InferredIntent]:
        """
        Last resort: ask LLM to infer intent.
        Lower confidence because LLM output is less deterministic.
        """
        if not self.llm:
            return None

        prompt = f"""
        A user was navigating to a URL that turned out to be a phishing site.
        URL: {user_context.get('target_url', 'unknown')}
        Referrer: {user_context.get('referrer', 'none')}
        Page claimed to be: {verdict.get('claimed_organization', 'unknown')}

        What was the user most likely trying to do?
        Respond in JSON:
        {{"organization": "name", "task": "brief task description"}}
        """

        try:
            response = await self.llm.generate(prompt=prompt, response_format="json")
            data = json.loads(response)
            return InferredIntent(
                organization=data.get("organization", "Unknown"),
                task=data.get("task", "access service"),
                confidence=0.50,  # Lower confidence for LLM inference
                source="llm_inference",
                reasoning=f"LLM inferred intent: {data.get('task', 'unknown')}"
            )
        except Exception:
            return None
```

---

## 2. Correct Path Resolution

### 2.1 Purpose

Given an inferred intent (organization + task), find the legitimate URL the user should go to. This is the **core differentiator** of ClickWise.

### 2.2 Resolution Hierarchy

The system tries resolution sources in order. The first successful match wins.

```
1. CURATED_REGISTRY     (highest trust — manually verified database)
       ↓ if not found
2. VERIFIED_OFFICIAL    (domain verification via DNS/WHOIS heuristics)
       ↓ if not found
3. SEARCH_DISCOVERY     (Google search for "[org] official site")
       ↓ if not found
4. LLM_REASONING        (ask Gemini — lowest trust, never used alone)
```

### 2.3 Implementation

```python
# backend/intent/correct_path.py

from dataclasses import dataclass
from backend.trusted_sources.registry import TrustedSourceRegistry

@dataclass
class CorrectPathResult:
    destination_url: str       # "https://onlinesbi.sbi.co.in"
    organization: str          # "State Bank of India"
    service: str               # "Online Banking"
    trust_source: str          # CURATED_REGISTRY | VERIFIED_OFFICIAL | SEARCH_DISCOVERY | LLM_REASONING
    confidence: float          # 0.0–1.0
    auto_redirect: bool        # true if confidence >= 0.80

class CorrectPathResolver:
    """
    Resolves the legitimate destination URL for a user's intent.
    Uses a hierarchical trust model — curated data > verification > search > LLM.
    """

    AUTO_REDIRECT_THRESHOLD = 0.80
    ASK_USER_THRESHOLD = 0.50

    def __init__(self, registry: TrustedSourceRegistry, llm_service=None):
        self.registry = registry
        self.llm = llm_service

    async def resolve(self, intent: 'InferredIntent', claimed_org: str = None) -> CorrectPathResult | None:
        """
        Resolve the correct path for the user's intent.
        Returns None if confidence is too low to suggest anything.
        """
        org_name = intent.organization or claimed_org

        if not org_name or org_name == "Unknown":
            return None

        # Level 1: Curated Registry
        result = self._resolve_from_registry(org_name, intent.task)
        if result:
            return result

        # Level 2: Verified Official (DNS/heuristic check)
        result = self._resolve_from_verification(org_name, intent.task)
        if result:
            return result

        # Level 3: Search Discovery
        result = await self._resolve_from_search(org_name, intent.task)
        if result:
            return result

        # Level 4: LLM Reasoning (lowest trust)
        result = await self._resolve_from_llm(org_name, intent.task)
        if result:
            return result

        return None

    def _resolve_from_registry(self, org_name: str, task: str) -> CorrectPathResult | None:
        """
        Level 1: Look up in curated Trusted Source Registry.
        Highest trust — these entries are manually verified.
        """
        org = self.registry.find_by_name(org_name)
        if not org:
            # Try fuzzy matching
            org = self.registry.find_by_fuzzy_name(org_name, threshold=0.80)

        if not org:
            return None

        # Select the best URL based on task
        destination_url = self._select_url_for_task(org, task)

        return CorrectPathResult(
            destination_url=destination_url,
            organization=org.name,
            service=self._task_to_service(task),
            trust_source="CURATED_REGISTRY",
            confidence=0.95,
            auto_redirect=True  # 0.95 >= 0.80
        )

    def _select_url_for_task(self, org, task: str) -> str:
        """Select the most appropriate URL from the org's known URLs."""
        login_urls = org.official_login_urls or []
        domains = org.official_domains or []

        # Task-specific URL selection
        LOGIN_TASKS = {"login", "online banking login", "authentication", "sign in"}
        if task.lower() in LOGIN_TASKS and login_urls:
            return login_urls[0]

        # Default: main domain
        if domains:
            domain = domains[0]
            if not domain.startswith("http"):
                domain = f"https://{domain}"
            return domain

        return login_urls[0] if login_urls else ""

    def _resolve_from_verification(self, org_name: str, task: str) -> CorrectPathResult | None:
        """
        Level 2: Attempt domain verification via heuristic.
        For common orgs, construct the likely official domain and verify it exists.
        """
        # Simple heuristic: for well-known patterns
        COMMON_PATTERNS = {
            ".co.in": ["bank", "india", "pvt"],
            ".gov.in": ["ministry", "government", "department"],
            ".ac.in": ["university", "college", "institute"],
            ".org.in": ["foundation", "trust"],
        }

        # This is a lightweight fallback — not as reliable as curated data
        # For hackathon, return None and rely on curated registry + LLM
        return None

    async def _resolve_from_search(self, org_name: str, task: str) -> CorrectPathResult | None:
        """
        Level 3: Search-based discovery.
        For hackathon: skip actual search, return None.
        Post-hackathon: use Google Custom Search API or SerpAPI.
        """
        # TODO: Implement search-based discovery
        # For hackathon, the curated registry should cover demo scenarios
        return None

    async def _resolve_from_llm(self, org_name: str, task: str) -> CorrectPathResult | None:
        """
        Level 4: Ask LLM for the official URL.
        LOWEST TRUST — never used as sole basis for redirect.
        """
        if not self.llm:
            return None

        prompt = f"""
        What is the official website URL for {org_name}'s {task} service in India?
        Return ONLY the URL, nothing else. It must be a real, verified URL.
        If unsure, respond with "UNKNOWN".
        """

        try:
            response = await self.llm.generate(prompt=prompt)
            url = response.strip().strip('"').strip("'")

            if url == "UNKNOWN" or not url.startswith("http"):
                return None

            return CorrectPathResult(
                destination_url=url,
                organization=org_name,
                service=self._task_to_service(task),
                trust_source="LLM_REASONING",
                confidence=0.45,  # Below auto-redirect threshold
                auto_redirect=False  # 0.45 < 0.80 — always ask user
            )
        except Exception:
            return None

    def _task_to_service(self, task: str) -> str:
        """Convert task string to a clean service name."""
        SERVICE_MAP = {
            "login": "Login",
            "online banking login": "Online Banking",
            "authentication": "Login",
            "KYC verification": "KYC Verification",
            "payment": "Payment",
            "fund transfer": "Fund Transfer",
            "account access": "Account Access",
            "registration": "Registration",
            "password recovery": "Password Recovery",
            "password reset": "Password Reset",
            "customer support": "Customer Support",
            "order tracking": "Order Tracking",
            "access service": "Home Page",
        }
        return SERVICE_MAP.get(task, task.title())
```

### 2.4 Auto-Redirect Decision

From System Design §3.7 — these thresholds are **not modifiable by this sub-PRD**:

| Confidence | Action | UI |
|---|---|---|
| `>= 0.80` | **Auto-redirect** | Show "Opening real site..." with 3-second countdown |
| `>= 0.50 && < 0.80` | **Ask user** | Show "Were you trying to access [org]?" with [Go] / [Cancel] |
| `< 0.50` | **No redirect** | Show verdict only, "Go back to safety" button |

**Hard rule from System Design:** When uncertain, ask instead of guessing. A wrong redirect is worse than no redirect.

---

## 3. Trusted Source Registry

### 3.1 Purpose

A queryable database of organizations mapped to their official domains, login URLs, and services. This is the **root of trust** for Correct Path resolution.

### 3.2 Implementation

```python
# backend/trusted_sources/registry.py

import json
import os
from typing import List, Optional
from dataclasses import dataclass
from difflib import SequenceMatcher

@dataclass
class TrustedOrganizationEntry:
    id: str
    name: str
    category: str                     # banking, government, payment, ecommerce, social, education
    official_domains: List[str]
    official_login_urls: List[str]
    known_services: List[str]
    logo_reference: Optional[str]
    verification_source: str

class TrustedSourceRegistry:
    """
    Queryable registry of trusted organizations.
    Seeded from JSON, stored in SQLite for persistence.
    """

    def __init__(self, db_session=None):
        self.db = db_session
        self._memory_cache = {}
        self._load_cache()

    def _load_cache(self):
        """Load all organizations into memory for fast lookup."""
        if self.db:
            orgs = self.db.query(TrustedOrganization).all()
            for org in orgs:
                entry = TrustedOrganizationEntry(
                    id=org.id,
                    name=org.name,
                    category=org.category,
                    official_domains=json.loads(org.official_domains_json),
                    official_login_urls=json.loads(org.official_login_urls_json),
                    known_services=json.loads(org.known_services_json),
                    logo_reference=org.logo_reference,
                    verification_source=org.verification_source,
                )
                self._memory_cache[org.id] = entry

    def find_by_name(self, name: str) -> Optional[TrustedOrganizationEntry]:
        """Exact or case-insensitive name match."""
        name_lower = name.lower()
        for entry in self._memory_cache.values():
            if entry.name.lower() == name_lower:
                return entry
        return None

    def find_by_fuzzy_name(self, name: str, threshold: float = 0.80) -> Optional[TrustedOrganizationEntry]:
        """Fuzzy name matching using SequenceMatcher."""
        name_lower = name.lower()
        best_match = None
        best_score = 0

        for entry in self._memory_cache.values():
            # Check full name
            score = SequenceMatcher(None, name_lower, entry.name.lower()).ratio()
            if score > best_score:
                best_score = score
                best_match = entry

            # Check known services and abbreviations
            for service in entry.known_services:
                score = SequenceMatcher(None, name_lower, service.lower()).ratio()
                if score > best_score:
                    best_score = score
                    best_match = entry

        if best_score >= threshold and best_match:
            return best_match
        return None

    def match_from_url(self, url: str) -> Optional[TrustedOrganizationEntry]:
        """Find an organization that this URL might be impersonating."""
        from urllib.parse import urlparse
        try:
            hostname = urlparse(url).hostname or ""
            hostname_lower = hostname.lower()
        except Exception:
            return None

        best_match = None
        best_score = 0

        for entry in self._memory_cache.values():
            for domain in entry.official_domains:
                domain_lower = domain.lower()
                # Extract key part of domain (e.g., "sbi" from "onlinesbi.sbi.co.in")
                domain_parts = domain_lower.replace(".", " ").split()

                for part in domain_parts:
                    if len(part) >= 3 and part in hostname_lower:
                        score = len(part) / len(hostname_lower)
                        if score > best_score:
                            best_score = score
                            best_match = entry

        if best_match and best_score > 0.1:
            return best_match
        return None

    def search_by_keywords(self, query: str) -> List[TrustedOrganizationEntry]:
        """Search for organizations matching keywords in a query."""
        query_lower = query.lower()
        results = []

        for entry in self._memory_cache.values():
            score = 0

            # Check name words
            for word in entry.name.lower().split():
                if word in query_lower and len(word) >= 3:
                    score += len(word)

            # Check known services
            for service in entry.known_services:
                if service.lower() in query_lower:
                    score += len(service)

            # Check domain keywords
            for domain in entry.official_domains:
                domain_key = domain.split(".")[0].lower()
                if domain_key in query_lower and len(domain_key) >= 3:
                    score += len(domain_key)

            if score > 0:
                results.append((score, entry))

        results.sort(key=lambda x: x[0], reverse=True)
        return [entry for _, entry in results]

    def seed_from_json(self, json_path: str):
        """Load seed data from JSON file into the database."""
        with open(json_path, 'r') as f:
            data = json.load(f)

        for item in data:
            org = TrustedOrganization(
                id=item["id"],
                name=item["name"],
                category=item["category"],
                official_domains_json=json.dumps(item["official_domains"]),
                official_login_urls_json=json.dumps(item.get("official_login_urls", [])),
                known_services_json=json.dumps(item.get("known_services", [])),
                logo_reference=item.get("logo_reference"),
                verification_source=item.get("verification_source", "manual_curation"),
            )
            self.db.merge(org)  # upsert

        self.db.commit()
        self._load_cache()  # refresh cache

    def compare_domains(self, suspicious_url: str, claimed_brand: str) -> dict:
        """
        Compare a suspicious URL's domain against the claimed brand's known domains.
        Returns a mismatch score (0.0 = matches, 1.0 = completely different).
        """
        from urllib.parse import urlparse

        try:
            suspicious_host = urlparse(suspicious_url).hostname or ""
        except Exception:
            return {"mismatch_score": 0.5, "details": "Could not parse URL"}

        org = self.find_by_name(claimed_brand) or self.find_by_fuzzy_name(claimed_brand)
        if not org:
            return {"mismatch_score": 0.5, "details": f"Organization '{claimed_brand}' not in registry"}

        # Check if suspicious domain matches any official domain
        for official_domain in org.official_domains:
            if suspicious_host == official_domain:
                return {"mismatch_score": 0.0, "details": "Domain matches official records"}
            if suspicious_host.endswith(f".{official_domain}"):
                return {"mismatch_score": 0.1, "details": "Subdomain of official domain"}

        # Calculate how different the suspicious domain is
        best_similarity = 0
        for official_domain in org.official_domains:
            sim = SequenceMatcher(None, suspicious_host, official_domain).ratio()
            best_similarity = max(best_similarity, sim)

        mismatch = 1.0 - best_similarity

        detail = f"Suspicious: {suspicious_host}, Official: {', '.join(org.official_domains)}"
        if best_similarity > 0.5:
            detail += " (similar but different — possible typosquatting)"

        return {"mismatch_score": mismatch, "details": detail}
```

### 3.3 Seed Data

The seed data file (`backend/data/trusted_sources_seed.json`) should be created by Kiro with 30-40 Indian organizations covering:

| Category | Example Organizations | Count Target |
|---|---|---|
| Banking | SBI, HDFC, ICICI, PNB, Axis, Kotak, BOB, Canara | 8–10 |
| Government | Income Tax, UIDAI/Aadhaar, DigiLocker, Passport Seva, IRCTC, EPFO | 6–8 |
| Payment | Paytm, PhonePe, Google Pay, BHIM, Razorpay | 5 |
| E-commerce | Amazon India, Flipkart, Myntra, Swiggy, Zomato | 5 |
| Social | WhatsApp, Instagram, X/Twitter | 3 |
| Education | UGC, AICTE, common universities | 3–4 |

### 3.4 Seed Script

```python
# backend/scripts/seed_trusted_sources.py

from backend.app.database import SessionLocal
from backend.trusted_sources.registry import TrustedSourceRegistry

def seed():
    db = SessionLocal()
    registry = TrustedSourceRegistry(db)
    seed_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'trusted_sources_seed.json')
    registry.seed_from_json(seed_path)
    print(f"Seeded {len(registry._memory_cache)} organizations into Trusted Source Registry")
    db.close()

if __name__ == "__main__":
    seed()
```

---

## 4. Module Location

```
backend/
├── intent/
│   ├── __init__.py
│   ├── inference.py              ← IntentInferenceEngine
│   └── correct_path.py           ← CorrectPathResolver
│
├── trusted_sources/
│   ├── __init__.py
│   ├── registry.py               ← TrustedSourceRegistry
│   └── seed_data.json            ← 30-40 org entries (created by Kiro)
```

---

## 5. Test / Acceptance Checklist

### Intent Inference

- [ ] Search query "sbi net banking" → infers SBI, task=online banking login, confidence ≥ 0.85
- [ ] Search query "flipkart order status" → infers Flipkart, task=order tracking
- [ ] URL `sbi-login-verify.example.com/kyc` → infers SBI, task=KYC verification
- [ ] Message "Verify your Paytm KYC immediately" → infers Paytm, task=KYC verification
- [ ] Unknown org → returns confidence=0.0, organization="Unknown"
- [ ] LLM fallback works when other sources fail
- [ ] LLM fallback has confidence ≤ 0.50 (below auto-redirect threshold)

### Correct Path Resolution

- [ ] Registry match returns confidence ≥ 0.90, trust_source=CURATED_REGISTRY
- [ ] Registry match auto_redirect=true (confidence above 0.80)
- [ ] LLM-only resolution returns confidence ≤ 0.45, auto_redirect=false
- [ ] Unknown organization returns None (no redirect)
- [ ] Task-specific URL selection works (login → login URL, general → main domain)

### Trusted Source Registry

- [ ] Seed script loads 30+ organizations
- [ ] find_by_name works (exact match)
- [ ] find_by_fuzzy_name works (e.g., "State Bank" matches "State Bank of India")
- [ ] match_from_url works (e.g., URL containing "sbi" matches SBI)
- [ ] search_by_keywords works (e.g., "sbi banking" returns SBI)
- [ ] compare_domains returns 0.0 for matching domains
- [ ] compare_domains returns high mismatch for completely different domains
- [ ] compare_domains detects typosquatting (high similarity but different domain)
- [ ] Memory cache refreshes after seeding

### Auto-Redirect Thresholds

- [ ] Confidence ≥ 0.80 → auto_redirect=true
- [ ] Confidence 0.50–0.79 → auto_redirect=false (ask user)
- [ ] Confidence < 0.50 → CorrectPathResult is None or auto_redirect=false

---

## 6. Dependencies on Other Sub-PRDs

| Dependency | Sub-PRD | What This PRD Needs |
|---|---|---|
| Investigation Agent | [03e](./03e-investigation-agent.md) | Provides `claimed_organization` from investigation |
| Detection ML | [03a](./03a-detection-ml.md) | Verdict with `claimed_organization` and `attack_type` |
| Backend API | [03b](./03b-backend-api.md) | Orchestrator calls intent inference after verdict |
| Extension | [03c](./03c-extension.md) | Renders Correct Path buttons |

## 7. What Breaks If This Contract Changes

| If This Changes... | These Break |
|---|---|
| `InferredIntent` schema | Backend Orchestrator, Investigation response |
| `CorrectPathResult` schema | Extension redirect UI, Dashboard verdict card |
| Auto-redirect thresholds | Extension redirect behavior |
| Registry data format | Seed script, registry queries |
| `trust_source` enum values | Extension trust badges, Dashboard display |

---

*Next: [Recovery Workflow](./03h-recovery-workflow.md)*
