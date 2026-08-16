# SecureSentinel
### An Autonomous AI Agent That Investigates Scams and Guides You to Safety

**One-line pitch:** SecureSentinel doesn't just warn you about scams — it investigates them, stops them, and gets you to where you actually meant to go.

**Theme:** Smart Automation (primary) · Blockchain & Cybersecurity (secondary)
**Category:** Software Edition

---

## 1. The Problem

Modern phishing and social-engineering attacks have moved far past poorly-written fake emails. Attackers now build convincing:

- Banking login clones
- Government-service impersonation pages
- Fake courier/delivery payment requests
- Fake KYC-update pages
- Fraudulent investment platforms
- QR-code and "urgent verification" scams

The core failure isn't the technology — it's the human on the other side of the screen. A security tool can say *"Potential phishing site detected"* and a confused, pressured user will still click **"Continue anyway."**

**Detection alone is not enough.** The system needs to understand what the user was trying to do, and safely help them get there — not just block them and walk away.

---

## 2. Empathy: Who This Actually Protects

> **Design principle: complexity belongs to the machine, clarity belongs to the user.**

**Elderly / digitally inexperienced users** — someone's grandmother gets a message: *"Your bank account will be blocked today. Verify immediately."* She doesn't know what a domain is, what HTTPS means, or how to check if a page is fake. She just wants her banking to work. SecureSentinel should say, in plain language: *"This site is pretending to be your bank. I've blocked it and opened the real one for you."*

**Students** — scholarship portals, internship applications, and fake placement/job links are a huge attack surface for students specifically, exploiting urgency and hope ("limited seats," "verify now or lose your slot").

**Families** — a tech-savvy son or daughter sets up protection for parents who aren't confident online, without needing to hover over their shoulder every time they browse.

**First-time digital-banking users** — a huge population in India moving from cash to UPI/net-banking for the first time, with no built-up instinct for what a fake page looks like.

This is fundamentally an **accessibility and dignity problem**, not just a security problem: the goal is letting people participate safely in digital India without requiring them to become cybersecurity experts first.

---

## 3. SDG Alignment

| SDG | How SecureSentinel Contributes |
|---|---|
| **SDG 1 — No Poverty** | Prevents direct financial loss from scams, which disproportionately hurts low-income and first-time digital users who have the least to lose and the least recourse. |
| **SDG 3 — Good Health & Well-Being** | Reduces the psychological stress, anxiety, and shame that scam victims — especially elderly users — experience after being defrauded. |
| **SDG 9 — Industry, Innovation & Infrastructure** | Contributes AI-agent based security infrastructure that can generalize across digital government and financial services. |
| **SDG 10 — Reduced Inequalities** | Closes the digital-literacy protection gap — people with less technical knowledge get the *same* level of protection as power users, not less. |
| **SDG 16 — Peace, Justice & Strong Institutions** | Builds public trust in digital government services (Digital India, UPI, Seva Sindhu-type portals) by reducing successful impersonation fraud against institutions. |

---

## 4. Core Novel Feature (the actual hackathon build)

This is the heart of the project — everything else in this document is an upgrade layered on top of this loop.

### 4.1 The loop: Detect → Investigate → Reason → Correct Path → Recover

```
        USER encounters a suspicious link/message
                        │
                        ▼
               ┌─────────────────┐
               │  DETECTION      │  ML classifier + heuristics + LLM check
               └────────┬────────┘
                        │ suspicious?
                        ▼
               ┌─────────────────┐
               │ INVESTIGATION   │  Agent opens the page in an isolated context
               └────────┬────────┘  + opens the real trusted site alongside it
                        ▼
               ┌─────────────────┐
               │  REASONING      │  Fuses all evidence into one explainable verdict
               └────────┬────────┘
                        ▼
               ┌─────────────────┐
               │ CORRECT PATH    │  Determines user's actual intent
               │ (novel feature) │  Blocks fake page → opens the REAL destination
               └────────┬────────┘
                        ▼
               ┌─────────────────┐
               │  RECOVERY       │  If credentials were already entered, guides
               └─────────────────┘  the user through safe next steps
```

### 4.2 Why "Correct Path" is the differentiator

Every existing phishing tool stops at "BLOCKED." That's security as *restriction* — it leaves the user stranded and often annoyed enough to disable the tool.

SecureSentinel instead asks: **what was this person actually trying to do?** If someone searched "SBI net banking login" and clicked a sponsored scam result, the system doesn't just block the fake page — it identifies the real intent (access SBI net banking) and opens the legitimate site directly. Security becomes *assistance*, not friction. This is the single feature to lead every pitch and demo with.

### 4.3 Explainable reasoning (not a black box)

Instead of returning `risk_score = 0.87`, the system produces a human-readable verdict:

> 🔴 **High-Risk Phishing** — Claimed organization: SBI. Domain resembles the real bank domain. Login form detected requesting password + OTP. Urgency language detected ("blocked today," "immediately"). Visual layout closely matches the real SBI login page. **Verdict: 94% likely credential phishing.**

---

## 5. The Math Underneath

### 5.1 Base detection model

Your existing LightGBM classifier (trained on ~500K URL samples, 30 engineered features, AUC-ROC 0.993) stays as the backbone signal — but gets retrained properly this time:

- **Class imbalance handling**: phishing URLs are a minority class in most real datasets → use class-weighted loss or SMOTE-style oversampling rather than naive accuracy optimization.
- **Feature engineering**: URL entropy, subdomain count, character-level n-gram frequency, presence of IP-literal hosts, TLD rarity, Levenshtein distance to known brand domains (typosquatting detection).
- **URL entropy** (measures "randomness" — phishing domains often look more random than real ones):

  H(URL) = − Σ p(c) · log₂ p(c)  for each character c in the domain

- **Typosquatting distance**: Levenshtein edit distance between the suspicious domain and a list of top trusted domains (banks, government portals). A distance of 1–2 characters from `sbi.co.in` is a strong signal.
- **Evaluation**: precision, recall, F1, and AUC-ROC on a held-out set — with an explicit focus on **recall** (catching real phishing) balanced against **false-positive rate** (you don't want to block legitimate sites and erode user trust).

### 5.2 Evidence fusion (combining multiple signals into one verdict)

Rather than hand-picking arbitrary weights, treat this as a small **stacked meta-classifier**: each investigation signal (ML score, DOM score, urgency-language score, visual-similarity score, threat-intel score) becomes a feature fed into a lightweight logistic regression or gradient-boosted meta-model, trained on labeled examples:

  P(phishing | evidence) = σ( w₀ + w₁·S_ml + w₂·S_dom + w₃·S_lang + w₄·S_visual + w₅·S_intel )

where σ is the sigmoid function and each wᵢ is learned rather than guessed — this gives you a defensible "why we trust this score" answer if judges push on it.

### 5.3 Visual/logo similarity

Compare a screenshot of the suspicious page against a small reference set of trusted brand login pages using perceptual image hashing or embedding cosine similarity:

  similarity(A, B) = (A · B) / (‖A‖ · ‖B‖)

A high similarity score to a known brand's login page, combined with a *low* domain-match score, is itself strong phishing evidence (cloned look, wrong address).

---

## 6. System Architecture

```
                              USER
                                │
                                ▼
                     ┌────────────────────┐
                     │  Chrome Extension  │
                     └─────────┬──────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │ Context Understanding  │
                    └────────────┬───────────┘
                                 │
             ┌───────────────────┼───────────────────┐
             ▼                   ▼                    ▼
       URL Analysis        Message Analysis     Page Content Analysis
             │                   │                    │
             └───────────────────┼────────────────────┘
                                 ▼
                        ┌─────────────────┐
                        │ Threat Detector │  ← LightGBM + heuristics + LLM
                        └────────┬────────┘
                            suspicious?
                                 ▼
                     ┌──────────────────────┐
                     │  Investigation Agent │
                     └───────────┬──────────┘
             ┌───────────────────┼───────────────────┐
             ▼                   ▼                    ▼
     Isolated Browser      Trusted Source        Visual/Logo
     (suspicious page)     (real org site)        Comparison
             │                   │                    │
             └───────────────────┼────────────────────┘
                                 ▼
                        ┌─────────────────┐
                        │ Evidence Fusion │  ← stacked meta-model (Sec. 5.2)
                        └────────┬────────┘
                                 ▼
                        ┌─────────────────┐
                        │ Threat Reasoner │  ← explainable verdict
                        └────────┬────────┘
                                 ▼
                        ┌─────────────────┐
                        │ Response Planner│
                        └────────┬────────┘
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                         ▼
       ALLOW                CORRECT PATH                 BLOCK
                        (redirect to real site)
                                 │
                                 ▼
                       Human Approval Layer
                     (for any consequential action)
                                 │
                                 ▼
                       Recovery / Notification
```

---

## 7. Real-World Scenarios

**Scenario 1 — Bank/KYC scam (flagship demo).** Elderly user gets *"Your account will be suspended. Verify KYC now."* Clicks link → SecureSentinel detects impersonation, investigates, confirms fraud, blocks the page, opens the real bank site, explains everything in one plain sentence.

**Scenario 2 — Fake government service.** *"Your government document needs immediate verification."* Agent identifies the claimed department, compares against the real portal, blocks the fake, redirects to the legitimate `.gov.in` service.

**Scenario 3 — Courier/delivery scam.** *"Your package cannot be delivered. Pay ₹25 to reschedule."* Agent flags the suspicious payment page and impersonated courier brand, blocks the payment flow, redirects to the real courier site.

**Scenario 4 — Fake investment platform.** *"Guaranteed 30% returns."* Instead of a flat block, the system explains: *"This site's financial claims could not be verified against trusted sources"* — informing rather than just gatekeeping.

**Scenario 5 — Student scholarship phishing.** Fake university login page harvesting credentials under scholarship-verification pressure — common enough on campuses to be personally relatable in your pitch.

**Scenario 6 — Family protection.** A family member sets up protection for a parent; if a high-severity threat is blocked, an opt-in notification goes to the family member — without constant monitoring of the parent's activity.

---

## 8. Human-in-the-Loop Safety Boundaries

Autonomy without limits isn't trustworthy — this table is worth keeping directly in your pitch deck, since judges will ask about it:

| Autonomy Level | Examples |
|---|---|
| **Automatic** | Analyze URLs, inspect suspicious pages in isolation, block confirmed-malicious pages, generate reports, open trusted reference pages |
| **Requires user confirmation** | Password reset guidance, changing security settings, sending notifications |
| **Never done autonomously** | Financial transfers, purchases, irreversible account actions, submitting real credentials anywhere |

---

## 9. Feature Roadmap

### 9.1 Core build (must work, polished, demoed live)
- Detection engine (retrained LightGBM + heuristics + LLM verification)
- Investigation agent (isolated browser context vs. trusted-source context)
- Evidence fusion + explainable reasoning
- **Correct Path** redirection (the headline feature)
- Basic guided recovery (instructions only, no live account actions)
- One flagship demo scenario built end-to-end (bank/KYC scam), 2–3 secondary scenarios shown as screenshots/recordings if time allows

### 9.2 Upgrade features (build if time allows, in this priority order)
1. **Visual/logo similarity detection** — screenshot embedding + cosine similarity against a small reference set of trusted brand pages (Sec. 5.3). High value-to-effort ratio; strengthens the "how do you know it's fake" story.
2. **Threat intelligence feed integration** — pull from free/public sources (e.g. PhishTank, OpenPhish) where rate limits allow; clearly label anything mocked for demo purposes so you're never caught overstating a live integration.
3. **Family protection notifications** — opt-in alert system (even a simple SMS/email/webhook trigger) when a high-severity threat is blocked for a linked account.
4. **Multi-agent decomposition** — once the core pipeline works end-to-end, split responsibilities into named agents (Detection, Investigation, Verification, Reasoning, Response, Recovery) for a cleaner architecture story and easier team division — but only after the pipeline itself is solid. Splitting into agents *before* the logic works just adds coordination overhead.
5. **Enterprise/SOC incident view** — a simple dashboard listing blocked incidents with evidence, positioned as "generalizes beyond citizens to enterprise security teams."

### 9.3 Explicitly out of scope for now
- Automated account recovery actions (password resets, session revocation via real APIs) — guidance only, not automation, since it needs account-level API access you won't have.
- Investigating **live real-world malicious sites** directly during the hackathon build/demo — build your own realistic fake phishing clones instead. Same demo impact, no legal/safety exposure, fully reliable when it matters (judging time).

---

## 10. Success Metrics

**Security:** detection precision, recall, false-positive rate, impersonation-detection accuracy.

**Agent performance:** investigation completion time, autonomous task success rate, correct-path redirection accuracy.

**Human impact:** reduction in user decision burden (can a non-technical user understand the verdict without help?), time saved per incident, percentage of threats resolved without manual intervention.

**Safety:** rate of any unsafe autonomous action, human-approval rate for consequential actions, false-intervention rate (blocking something legitimate).

---

## 11. Suggested SIH Problem Statement Wording

> Develop an autonomous AI agent capable of detecting, investigating, and responding to phishing and social-engineering attacks in real time. The system should safely operate an isolated browser environment to investigate suspicious websites, verify claimed identities against trusted sources, analyze behavioral, linguistic, and visual indicators, prevent malicious interactions, and — rather than simply blocking the user — identify their original intent and redirect them to the legitimate destination. The solution should incorporate human-in-the-loop controls for high-risk or irreversible actions and provide an explainable, auditable trail of its decisions.
