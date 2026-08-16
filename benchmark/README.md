# 🧪 ClickWise Benchmark Test Pages

## ⚠️ DISCLAIMER

**These are CONTROLLED, SIMULATED phishing pages for testing purposes only.**

- ✅ **Safe for testing** — No actual phishing, no data collection, no external connections
- ✅ **Educational use only** — For demonstrating ClickWise detection capabilities
- ❌ **Never deploy publicly** — These pages are designed to look like phishing attacks
- ❌ **No real credentials** — Do not enter real passwords or payment information

All forms submit to `#` (nowhere) and contain no backend logic.

---

## 📋 Test Scenarios

### 1. SBI KYC Phishing (`scenarios/sbi-kyc-phishing/`)
**Risk Level:** HIGH (75-90%)

Simulates a fake SBI (State Bank of India) KYC verification page with:
- Official-looking SBI branding (blue theme, logo placeholder)
- Login form requesting username, password, and OTP
- Urgency messaging ("Your account will be blocked in 24 hours")
- Poor grammar and suspicious URL patterns

**Expected Detection:**
- ✅ Brand impersonation (SBI)
- ✅ Urgency/fear tactics
- ✅ Credential harvesting indicators
- ✅ High risk score (75%+)

---

### 2. Courier Payment Scam (`scenarios/courier-payment-scam/`)
**Risk Level:** HIGH (80-95%)

Simulates a fake courier delivery payment page with:
- Generic courier branding
- Payment request for small amount (₹25) to "reschedule delivery"
- Credit card form (card number, expiry, CVV)
- Urgent delivery deadline

**Expected Detection:**
- ✅ Payment urgency tactics
- ✅ Credit card harvesting
- ✅ Social engineering (fake delivery notice)
- ✅ Very high risk score (80%+)

---

### 3. Scholarship Phishing (`scenarios/scholarship-phishing/`)
**Risk Level:** MEDIUM-HIGH (70-85%)

Simulates a fake university scholarship verification page with:
- University-style branding (academic colors, seal placeholder)
- "Verify your details to confirm scholarship" messaging
- Email and password form fields
- Limited time offer pressure

**Expected Detection:**
- ✅ Authority impersonation (university)
- ✅ Credential harvesting
- ✅ Urgency tactics ("Limited slots")
- ✅ High risk score (70%+)

---

### 4. Legitimate SBI Mock (`scenarios/legitimate-sbi/`)
**Risk Level:** LOW (0-20%)

A clean mock of SBI's real login page with:
- Professional design
- No urgency messaging
- No suspicious patterns
- Clean URL structure

**Expected Detection:**
- ✅ Should score LOW risk (under 20%)
- ✅ Tests false positive prevention
- ✅ Demonstrates whitelist/brand recognition

---

## 🚀 How to Use

### Local Testing

1. **Serve pages locally:**
   ```bash
   # Option 1: Python
   cd benchmark/scenarios/sbi-kyc-phishing
   python -m http.server 8080
   
   # Option 2: Node.js
   npx serve
   
   # Option 3: VS Code Live Server
   # Right-click index.html → "Open with Live Server"
   ```

2. **Access in browser:**
   ```
   http://localhost:8080
   ```

3. **Watch ClickWise detect it:**
   - Extension badge should appear (red for phishing, yellow for suspicious, green for safe)
   - Click badge for detailed risk analysis
   - Check popup for threat breakdown

### Automated Testing Script

```bash
# Run all benchmark tests (if implemented)
python scripts/run_benchmark.py --verbose
```

---

## 📊 Evaluation Metrics

For each scenario, ClickWise should provide:

| Scenario | Expected Risk Score | Key Signals |
|----------|---------------------|-------------|
| SBI KYC Phishing | 75-90% | Brand impersonation, urgency, credential harvesting |
| Courier Payment Scam | 80-95% | Payment urgency, credit card harvesting, fake notice |
| Scholarship Phishing | 70-85% | Authority impersonation, urgency, credential request |
| Legitimate SBI | 0-20% | Clean design, no red flags |

**Pass Criteria:**
- ✅ Phishing pages score >70%
- ✅ Legitimate page scores <30%
- ✅ No false negatives (missed phishing)
- ✅ No false positives (legitimate flagged as phishing)

---

## 🔧 Customization

To create your own test scenario:

1. Create a new folder: `scenarios/your-scenario-name/`
2. Add `index.html` with phishing indicators (or clean design for control)
3. Add `style.css` for branding
4. Update this README with scenario description

**Phishing Indicators to Include:**
- ❌ Urgency/fear messaging ("Account will be suspended!")
- ❌ Authority impersonation (bank, government, university logos)
- ❌ Credential harvesting (login forms, payment fields)
- ❌ Poor grammar/spelling
- ❌ Suspicious URL patterns (in comments or meta tags)
- ❌ Excessive use of urgency keywords

---

## 🛡️ Safety Notes

**These pages are intentionally designed to look suspicious.** They help us:
- Test ML model accuracy
- Demonstrate ClickWise capabilities to stakeholders
- Improve detection heuristics
- Train the system on edge cases

**Never:**
- Deploy these to public servers
- Share URLs without context
- Use for actual phishing attacks (illegal and unethical)
- Enter real credentials or payment information

**Always:**
- Keep them in local development only
- Use for educational/testing purposes
- Label them clearly as "DEMO" or "TEST"
- Add security headers if serving over network

---

## 📝 License

**Educational Use Only** — These pages are part of the ClickWise testing suite. Not for production deployment.

If you create new benchmark scenarios, contribute them back to the project!

---

## 🤝 Contributing New Scenarios

Want to add a new phishing scenario? Follow this template:

1. **Identify real-world phishing pattern** (e.g., fake tax refund, lottery scam)
2. **Create realistic mock** with clear indicators
3. **Document expected behavior** (risk score, detected signals)
4. **Test against ClickWise** and verify accuracy
5. **Submit PR** with scenario folder + README update

---

**Last Updated:** 2026-08-17  
**Maintained by:** ClickWise Security Research Team
