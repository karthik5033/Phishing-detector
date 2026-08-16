# Sub-PRD: Recovery Workflow

> **Document:** `docs/planning/prds/03h-recovery-workflow.md`
> **Owner:** Backend/Security Infrastructure Lead (Member 5)
> **Depends on:** [System Design](../02-system-design.md), [Intent & Correct Path](./03g-intent-correct-path.md)
> **Status:** Sub-PRD — must not contradict System Design

---

## Contracts Consumed

| Contract | Source | Section |
|---|---|---|
| `RecoveryWorkflow` schema | [System Design](../02-system-design.md#39-recovery-workflow-contract) | §3.9 |
| `exposure_type` enum | [System Design](../02-system-design.md#13-enums-and-status-values) | §1.3 |
| Trusted Source Registry | [Intent & Correct Path](./03g-intent-correct-path.md#3-trusted-source-registry) | §3 |

## Contracts Produced

| Contract | Consumers |
|---|---|
| `RecoveryWorkflow` object | [Backend API](./03b-backend-api.md) (includes in investigation response), [Extension](./03c-extension.md) (renders guidance) |

---

## Scope

### In Scope

1. Recovery workflow generation for credential exposure
2. Recovery workflow generation for payment exposure
3. Recovery workflow generation for personal info (PII) exposure
4. Organization-specific recovery steps (using Trusted Source Registry data)
5. Generic fallback recovery for unknown organizations

### Out of Scope

- **Autonomous account actions** — the system NEVER resets passwords, freezes cards, or makes API calls to real services. Guidance only.
- Exposure detection logic (see [Extension](./03c-extension.md#7-exposure-detection))
- Extension UI rendering (see [Extension](./03c-extension.md#23-interstitial-page))

---

## 1. Core Principle

> **The Recovery Workflow Engine provides structured guidance. It does NOT perform any actions on the user's behalf.** No password resets, no session revocations, no payment freezes. Every step is an instruction or a link the user follows manually.

This is a non-negotiable safety boundary. Even if technically possible, autonomous recovery actions create liability, trust, and safety issues.

---

## 2. Architecture

```
Exposure Detection (Extension content script)
    │
    ├── exposure_type: CREDENTIAL | PAYMENT | PERSONAL_INFO
    ├── affected_fields: ["password", "otp", ...]
    │
    ▼
Recovery Workflow Engine
    │
    ├── Identify service category (banking, govt, payment, etc.)
    ├── Look up org-specific recovery steps from templates
    ├── Fall back to generic template if org not in registry
    │
    ▼
RecoveryWorkflow object → Extension renders it
```

---

## 3. Implementation

```python
# backend/recovery/workflows.py

from dataclasses import dataclass
from typing import List, Optional
from backend.trusted_sources.registry import TrustedSourceRegistry

@dataclass
class RecoveryStep:
    order: int
    title: str
    description: str
    action_type: str           # navigate | instruct | contact
    url: Optional[str]         # URL for navigate actions, None otherwise
    urgency: str = "HIGH"      # HIGH | MEDIUM | LOW

@dataclass
class RecoveryWorkflow:
    exposure_type: str         # CREDENTIAL | PAYMENT | PERSONAL_INFO
    severity: str              # CRITICAL | HIGH | MEDIUM
    affected_service: str
    steps: List[RecoveryStep]

class RecoveryWorkflowEngine:
    """
    Generates structured recovery guidance based on exposure type
    and affected service.
    """

    def __init__(self, registry: TrustedSourceRegistry):
        self.registry = registry

    def generate(
        self,
        exposure_type: str,
        affected_service: str,
        service_category: str,
        official_url: str = None,
        fields_exposed: List[str] = None
    ) -> RecoveryWorkflow:
        """
        Generate a recovery workflow.
        Uses org-specific templates when available, generic otherwise.
        """
        fields_exposed = fields_exposed or []

        if exposure_type == "CREDENTIAL":
            return self._credential_recovery(
                affected_service, service_category, official_url, fields_exposed
            )
        elif exposure_type == "PAYMENT":
            return self._payment_recovery(
                affected_service, service_category, official_url, fields_exposed
            )
        elif exposure_type == "PERSONAL_INFO":
            return self._pii_recovery(
                affected_service, service_category, official_url, fields_exposed
            )
        else:
            return RecoveryWorkflow(
                exposure_type=exposure_type,
                severity="MEDIUM",
                affected_service=affected_service,
                steps=[]
            )

    # ─── Credential Recovery ───

    def _credential_recovery(self, service, category, url, fields) -> RecoveryWorkflow:
        """Recovery for password/OTP exposure."""
        steps = []
        step_order = 1

        # Step 1: Change password immediately
        steps.append(RecoveryStep(
            order=step_order,
            title="Change your password immediately",
            description=f"Go to the official {service} website and change your password right now. Do not reuse the compromised password.",
            action_type="navigate",
            url=url,
            urgency="HIGH"
        ))
        step_order += 1

        # Step 2: Revoke sessions (if applicable)
        if category in ("banking", "payment", "email", "social_media"):
            steps.append(RecoveryStep(
                order=step_order,
                title="Log out of all active sessions",
                description=f"In your {service} account settings, find 'Active Sessions' or 'Security' and log out of all devices.",
                action_type="instruct",
                url=None,
                urgency="HIGH"
            ))
            step_order += 1

        # Step 3: Enable MFA
        steps.append(RecoveryStep(
            order=step_order,
            title="Enable Two-Factor Authentication",
            description="If not already enabled, turn on 2FA/MFA in your account security settings. Use an authenticator app instead of SMS if possible.",
            action_type="instruct",
            url=None,
            urgency="HIGH"
        ))
        step_order += 1

        # Step 4: Check for unauthorized activity
        if category == "banking":
            steps.append(RecoveryStep(
                order=step_order,
                title="Review recent transactions",
                description=f"Check your {service} account statement for any unauthorized transactions in the last 24 hours.",
                action_type="instruct",
                url=None,
                urgency="HIGH"
            ))
            step_order += 1
        elif category == "ecommerce":
            steps.append(RecoveryStep(
                order=step_order,
                title="Check recent orders",
                description=f"Review your {service} order history for any purchases you didn't make.",
                action_type="instruct",
                url=None,
                urgency="MEDIUM"
            ))
            step_order += 1

        # Step 5: Change password on other sites (if reused)
        steps.append(RecoveryStep(
            order=step_order,
            title="Update reused passwords",
            description="If you used the same password on other websites, change those passwords too. Use unique passwords for each site.",
            action_type="instruct",
            url=None,
            urgency="MEDIUM"
        ))
        step_order += 1

        # Step 6: Contact support
        contact_info = self._get_contact_info(service, category)
        steps.append(RecoveryStep(
            order=step_order,
            title="Contact official support if needed",
            description=f"If you notice any unauthorized activity, contact {service}'s official support. {contact_info}",
            action_type="contact",
            url=None,
            urgency="MEDIUM"
        ))

        severity = "CRITICAL" if category in ("banking", "payment") else "HIGH"

        return RecoveryWorkflow(
            exposure_type="CREDENTIAL",
            severity=severity,
            affected_service=service,
            steps=steps
        )

    # ─── Payment Recovery ───

    def _payment_recovery(self, service, category, url, fields) -> RecoveryWorkflow:
        """Recovery for card/UPI/payment exposure."""
        steps = []
        step_order = 1

        has_card = any(f in fields for f in ["card_number", "credit_card", "debit_card"])
        has_cvv = "cvv" in fields

        if has_card or has_cvv:
            # Card-specific steps
            steps.append(RecoveryStep(
                order=step_order,
                title="Block your card immediately",
                description="Call your bank's card helpline or use your banking app to temporarily block your card. Most banks have instant card block in their app.",
                action_type="contact",
                url=None,
                urgency="HIGH"
            ))
            step_order += 1

            steps.append(RecoveryStep(
                order=step_order,
                title="Report to your bank",
                description="Call your bank's fraud reporting number immediately. Report the card details may be compromised. Ask about a replacement card.",
                action_type="contact",
                url=None,
                urgency="HIGH"
            ))
            step_order += 1

        # UPI-specific
        if any(f in fields for f in ["upi_pin", "mpin", "upi"]):
            steps.append(RecoveryStep(
                order=step_order,
                title="Change your UPI PIN",
                description="Open your UPI app (Google Pay, PhonePe, Paytm, BHIM) and change your UPI PIN immediately.",
                action_type="instruct",
                url=None,
                urgency="HIGH"
            ))
            step_order += 1

        # Monitor transactions
        steps.append(RecoveryStep(
            order=step_order,
            title="Monitor your account for 48 hours",
            description="Watch for any unauthorized transactions. Enable SMS/email alerts for all transactions if not already active.",
            action_type="instruct",
            url=None,
            urgency="HIGH"
        ))
        step_order += 1

        # File complaint
        steps.append(RecoveryStep(
            order=step_order,
            title="File a cyber fraud complaint",
            description="If unauthorized transactions occur, call the National Cyber Crime Helpline: 1930, or file a complaint at cybercrime.gov.in within 24 hours for the best chance of recovery.",
            action_type="navigate",
            url="https://cybercrime.gov.in",
            urgency="MEDIUM"
        ))
        step_order += 1

        # Bank contact
        contact_info = self._get_contact_info(service, "banking")
        steps.append(RecoveryStep(
            order=step_order,
            title="Contact your bank's fraud department",
            description=f"Report the incident to {service}'s fraud department. {contact_info}",
            action_type="contact",
            url=None,
            urgency="MEDIUM"
        ))

        return RecoveryWorkflow(
            exposure_type="PAYMENT",
            severity="CRITICAL",
            affected_service=service,
            steps=steps
        )

    # ─── PII Recovery ───

    def _pii_recovery(self, service, category, url, fields) -> RecoveryWorkflow:
        """Recovery for Aadhaar/PAN/personal info exposure."""
        steps = []
        step_order = 1

        has_aadhaar = any(f in fields for f in ["aadhaar", "aadhar"])
        has_pan = "pan" in fields

        if has_aadhaar:
            steps.append(RecoveryStep(
                order=step_order,
                title="Lock your Aadhaar biometrics",
                description="Visit the UIDAI website and lock your Aadhaar biometrics to prevent misuse. You can also generate a Virtual ID (VID) instead of sharing your actual Aadhaar number.",
                action_type="navigate",
                url="https://myaadhaar.uidai.gov.in",
                urgency="HIGH"
            ))
            step_order += 1

        if has_pan:
            steps.append(RecoveryStep(
                order=step_order,
                title="Monitor your PAN for misuse",
                description="Check the Income Tax e-filing portal to ensure no unauthorized tax filings have been made using your PAN. Set up alerts if available.",
                action_type="navigate",
                url="https://www.incometax.gov.in",
                urgency="MEDIUM"
            ))
            step_order += 1

        steps.append(RecoveryStep(
            order=step_order,
            title="Place fraud alerts",
            description="Contact the credit bureaus (CIBIL, Experian, Equifax India) to place a fraud alert on your credit profile. This makes it harder for anyone to open accounts in your name.",
            action_type="instruct",
            url=None,
            urgency="MEDIUM"
        ))
        step_order += 1

        steps.append(RecoveryStep(
            order=step_order,
            title="File a cyber crime complaint",
            description="Report the data exposure at the National Cyber Crime Reporting Portal or call the helpline: 1930.",
            action_type="navigate",
            url="https://cybercrime.gov.in",
            urgency="MEDIUM"
        ))

        return RecoveryWorkflow(
            exposure_type="PERSONAL_INFO",
            severity="HIGH",
            affected_service=service,
            steps=steps
        )

    # ─── Contact Info ───

    KNOWN_HELPLINES = {
        "State Bank of India": "SBI Helpline: 1800-11-2211 (toll-free)",
        "HDFC Bank": "HDFC Helpline: 1800-22-1006 (toll-free)",
        "ICICI Bank": "ICICI Helpline: 1800-1080 (toll-free)",
        "Axis Bank": "Axis Helpline: 1860-419-5555",
        "Punjab National Bank": "PNB Helpline: 1800-180-2222 (toll-free)",
        "Kotak Mahindra Bank": "Kotak Helpline: 1860-266-2666",
        "Paytm": "Paytm Support: support@paytm.com or in-app help",
        "PhonePe": "PhonePe Support: in-app help or 080-68727374",
        "Google Pay": "Google Pay Support: in-app help section",
    }

    def _get_contact_info(self, service: str, category: str) -> str:
        """Get org-specific contact info, or generic fallback."""
        if service in self.KNOWN_HELPLINES:
            return self.KNOWN_HELPLINES[service]

        if category == "banking":
            return "Check the back of your bank card or visit your bank's official website for the customer care number."
        elif category == "government":
            return "Visit the department's official website for contact details."
        else:
            return "Visit the official website for customer support contact details."
```

---

## 4. Module Location

```
backend/
├── recovery/
│   ├── __init__.py
│   └── workflows.py         ← RecoveryWorkflowEngine
```

---

## 5. Test / Acceptance Checklist

### Credential Recovery

- [ ] Password exposure → steps include change password + revoke sessions + enable MFA
- [ ] Banking credential exposure → severity = CRITICAL
- [ ] Non-banking credential exposure → severity = HIGH
- [ ] "Change password" step includes navigate link to official URL
- [ ] "Contact support" step includes org-specific helpline when known
- [ ] Generic fallback works for unknown organizations

### Payment Recovery

- [ ] Card exposure → steps include block card + report to bank
- [ ] UPI PIN exposure → steps include change UPI PIN
- [ ] All payment recovery → includes cyber crime complaint step (cybercrime.gov.in)
- [ ] Severity = CRITICAL for all payment exposure

### PII Recovery

- [ ] Aadhaar exposure → step to lock biometrics at UIDAI
- [ ] PAN exposure → step to monitor at Income Tax portal
- [ ] All PII recovery → includes credit bureau alert step
- [ ] All PII recovery → includes cyber crime complaint step

### Safety

- [ ] No step performs autonomous actions (all are navigate/instruct/contact)
- [ ] All URLs in steps point to official, verified sites
- [ ] No step requires the user to share credentials with ClickWise
- [ ] Severity levels are accurate (CRITICAL for banking/payment, HIGH for PII)

### India-Specific

- [ ] Cyber crime helpline number is correct (1930)
- [ ] cybercrime.gov.in URL is correct
- [ ] UIDAI URL is correct (myaadhaar.uidai.gov.in)
- [ ] Income Tax URL is correct (www.incometax.gov.in)
- [ ] Bank helpline numbers are accurate for seeded organizations

---

## 6. Dependencies on Other Sub-PRDs

| Dependency | Sub-PRD | What This PRD Needs |
|---|---|---|
| Intent & Correct Path | [03g](./03g-intent-correct-path.md) | Trusted Source Registry for org-specific recovery |
| Extension | [03c](./03c-extension.md) | Exposure detection data (exposure_type, fields_exposed) |
| Backend API | [03b](./03b-backend-api.md) | Orchestrator calls this after verdict + exposure detection |

## 7. What Breaks If This Contract Changes

| If This Changes... | These Break |
|---|---|
| `RecoveryWorkflow` schema | Extension recovery UI rendering |
| `RecoveryStep` schema | Extension step rendering |
| `action_type` values | Extension button behavior (navigate vs instruct) |
| Helpline numbers | User trust (wrong numbers = bad experience) |

---

*All 8 sub-PRDs are now complete. Next: [Fix List](../04-fix-list.md) (Step 5)*
