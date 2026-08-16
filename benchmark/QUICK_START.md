# 🚀 Quick Start Guide - ClickWise Benchmark Testing

## Overview
This directory contains controlled phishing simulations for testing ClickWise detection accuracy.

---

## ⚡ Quick Test (30 seconds)

### Option 1: VS Code Live Server (Easiest)
1. Install "Live Server" extension in VS Code
2. Right-click any `index.html` file → "Open with Live Server"
3. Watch ClickWise detect it automatically

### Option 2: Python HTTP Server
```bash
# Navigate to any scenario folder
cd scenarios/sbi-kyc-phishing

# Start server
python -m http.server 8080

# Open in browser
# http://localhost:8080
```

### Option 3: Node.js
```bash
# Install serve globally (one-time)
npm install -g serve

# Run from any scenario folder
cd scenarios/courier-payment-scam
serve

# Opens automatically in browser
```

---

## 📊 Expected Results

| Test Page | Expected Risk Score | Badge Color | Key Detection Signals |
|-----------|---------------------|-------------|----------------------|
| **sbi-kyc-phishing/** | 75-90% | 🔴 Red | Brand impersonation, urgency, credential harvesting |
| **courier-payment-scam/** | 80-95% | 🔴 Red | Payment urgency, credit card theft, fake deadline |
| **scholarship-phishing/** | 70-85% | 🔴 Red | Authority impersonation, urgency, password request |
| **legitimate-sbi/** | 0-20% | 🟢 Green | Clean design, no red flags |

---

## 🧪 Testing Checklist

For each test page:

✅ **Visual Indicators:**
- [ ] ClickWise badge appears next to page title or in extension popup
- [ ] Badge color matches expected risk level
- [ ] Popup shows risk percentage and breakdown

✅ **Detection Accuracy:**
- [ ] Phishing pages score >70%
- [ ] Legitimate page scores <30%
- [ ] No false negatives (phishing missed)
- [ ] No false positives (legitimate flagged)

✅ **Detailed Analysis:**
- [ ] Click badge to view popup
- [ ] Check "Detection Signals" section
- [ ] Verify key patterns are identified
- [ ] Review heuristics scores

✅ **Blocking (if enabled):**
- [ ] High-risk pages should show block screen
- [ ] Block page shows risk score
- [ ] "Proceed Anyway" requires confirmation

---

## 🛠️ Troubleshooting

### Badge Not Appearing?
1. **Check extension is installed:** Chrome → Extensions → ClickWise should be active
2. **Refresh the page:** Ctrl+R or F5
3. **Check backend is running:** 
   ```bash
   # Test backend health
   curl http://127.0.0.1:8002/health
   # Should return: {"status": "active"}
   ```
4. **Check console:** F12 → Console → Look for ClickWise logs

### Wrong Risk Score?
1. **Clear cache:** Extension may have cached old results
   ```javascript
   // In browser console:
   chrome.storage.local.clear()
   ```
2. **Restart backend:** Stop and restart `python start_server.py`
3. **Force rescan:** Close and reopen the page

### Page Loads but No Detection?
- **Check URL:** Extension only scans `http://` or `https://` URLs
- **Check content script:** F12 → Console → Should see `[ClickWise] Content Script Active`
- **Check service worker:** Chrome → Extensions → ClickWise → Service Worker → Inspect

---

## 🔍 Advanced Testing

### Test Specific Features

**Test ML Model:**
```bash
# Run detection on a URL directly
curl -X POST http://127.0.0.1:8002/api/v1/detect \
  -H "Content-Type: application/json" \
  -d '{"url": "http://localhost:8080"}'
```

**Test Heuristics:**
- Look for patterns in the HTML (urgency keywords, brand names, form fields)
- Check if extension identifies: `urgency`, `authority_impersonation`, `credential_harvesting`

**Test LLM Verification:**
- Navigate to `/features/neural-detection` in dashboard
- Paste test URL
- View AI analysis and reasoning

### Benchmark All Scenarios
Create a test script to automate testing:

```bash
#!/bin/bash
# benchmark_test.sh

scenarios=("sbi-kyc-phishing" "courier-payment-scam" "scholarship-phishing" "legitimate-sbi")

for scenario in "${scenarios[@]}"; do
  echo "Testing: $scenario"
  cd "scenarios/$scenario"
  
  # Start server in background
  python -m http.server 8081 &
  SERVER_PID=$!
  
  sleep 2
  
  # Test with curl
  curl -X POST http://127.0.0.1:8002/api/v1/detect \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"http://localhost:8081\"}" \
    -s | jq '.confidence_score, .risk_level'
  
  # Stop server
  kill $SERVER_PID
  
  cd ../..
done
```

---

## 📝 Creating New Test Scenarios

1. **Create folder:** `scenarios/your-scenario-name/`
2. **Add files:**
   - `index.html` — The phishing/test page
   - `style.css` — Styling (inline CSS also works)
3. **Include indicators:**
   - ❌ Urgency keywords (limited time, act now, expired)
   - ❌ Authority/brand impersonation (logos, official-looking headers)
   - ❌ Credential harvesting (password, OTP, credit card fields)
   - ❌ Poor grammar/spelling (if realistic)
   - ❌ Suspicious patterns (too many form fields, fake trust badges)
4. **Test it:** Serve locally and check ClickWise detection
5. **Document it:** Update `README.md` with expected results

---

## 🎯 Success Criteria

Your ClickWise deployment passes benchmark testing if:

✅ **High Accuracy:**
- All phishing scenarios score >70%
- Legitimate scenario scores <30%

✅ **Correct Classifications:**
- No false negatives (zero phishing missed)
- No false positives (legitimate site not flagged as phishing)

✅ **Consistent Performance:**
- Results stable across multiple tests
- Badge appears within 2 seconds

✅ **Detailed Reporting:**
- Popup shows breakdown of detected signals
- Dashboard logs all scans correctly

---

## 📚 Additional Resources

- **Main README:** `README.md` — Full documentation
- **ClickWise Docs:** `../README.md` — Project overview
- **API Documentation:** `../backend/README.md` — Backend API reference
- **Extension Docs:** `../extension-clean/README.md` — Extension details

---

## 🤝 Contributing

Found an edge case? Create a new test scenario!

**Steps:**
1. Identify real-world phishing pattern
2. Create realistic simulation
3. Document expected behavior
4. Test against ClickWise
5. Submit PR with your scenario

---

**Happy Testing! 🎉**

Last Updated: 2026-08-17
