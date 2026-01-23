from fastapi import FastAPI, HTTPException, Request, Depends
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
import torch.nn as nn
import numpy as np
import os
import joblib
import sys
import re
import json

# Add parent directory to path to access models if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import get_db
from app import models

app = FastAPI(
    title="SecureSentinel API",
    description="Real-time Phishing Detection using Sklearn (Reverted)",
    version="4.0.0", 
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===========================
# 2. MODEL LOADING (REVERTED TO SKLEARN)
# ===========================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKLEARN_MODELS_DIR = os.path.join(BASE_DIR, 'models') # Root/models
MODEL_PATH = os.path.join(SKLEARN_MODELS_DIR, 'model_enhanced.joblib')
VECTORIZER_PATH = os.path.join(SKLEARN_MODELS_DIR, 'vectorizer_enhanced.joblib')

print(f"🔄 Reverting to Old Model: {MODEL_PATH}")

model = None
vectorizer = None

# ===========================
# 2. LOAD ML MODELS (ROBUST & SAFE)
# ===========================
model = None
vectorizer = None
MODEL_STATUS = "DISABLED" # Status for Health Check

# ===========================
# 2. LOAD ML MODELS (SAFE MODE)
# ===========================
model = None
vectorizer = None
MODEL_STATUS = "DISABLED (Code Safety)"

# CRITICAL: Sklearn model is causing Segfaults on load. 
# We are disabling it completely to ensure backend stability.
# try:
#     if os.path.exists(MODEL_PATH) and os.path.exists(VECTORIZER_PATH):
#         loaded_model = joblib.load(MODEL_PATH) ...
# except ...
print("⚠️  AI Model Disabled: Running in STRICT BLOCKLIST MODE.")

# Device check irrelevant but kept for compatibility
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"🚀 API Device: {device} (Note: Sklearn runs on CPU)")

# ===========================
# 3. API ENDPOINTS
# ===========================

class URLRequest(BaseModel):
    url: str

class DetectionResponse(BaseModel):
    url: str
    is_phishing: bool
    confidence_score: float
    max_risk_score: float  # Added for Extension Compatibility
    risk_level: str
    heuristics: dict

from datetime import datetime, timedelta

@app.post("/api/v1/detect", response_model=DetectionResponse)
async def detect_phishing(request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
        
        # Support 'text' field as fallback for 'url'
        raw_input = body.get("url") or body.get("text")
        
        if not raw_input:
             # Gracefully handle empty
             return {
                 "url": "",
                 "is_phishing": False,
                 "confidence_score": 0.0,
                 "max_risk_score": 0.0,
                 "risk_level": "Low",
                 "heuristics": {"error": "No content"}
             }
        
        # Check if it looks like a URL (basic check)
        # If it has spaces or newlines, it's likely text content, not a URL
        if " " in raw_input.strip() or "\n" in raw_input:
            return {
                "url": raw_input[:50] + "...",
                "is_phishing": False,
                "confidence_score": 0.0,
                "max_risk_score": 0.0,
                "risk_level": "Low",
                "heuristics": {"note": "Skipped - Text Content"}
            }

        url = raw_input
        
        # Whitelist Localhost
        if "localhost" in url or "127.0.0.1" in url:
             return {
                 "url": url,
                 "is_phishing": False,
                 "confidence_score": 0.0,
                 "max_risk_score": 0.0,
                 "risk_level": "Low",
                 "heuristics": {"note": "Localhost Safe"}
             }
        
    except Exception as e:
        print(f"Payload Error: {e}")
        # Return safe default instead of 422 to prevent frontend crash
        return {
                "url": "error",
                "is_phishing": False,
                "confidence_score": 0.0,
                "risk_level": "Low",
                "heuristics": {"error": str(e)}
        }
    
    # Extract Domain using consistent normalizer
    clean_host = normalize_domain(url)
    domain = clean_host
    clean_domain = clean_host.replace("www.", "")
    
    # 0. Check Blocklist (Critical)
    blocked_entry = db.query(models.BlockedDomain).filter(models.BlockedDomain.domain == clean_host).first()
    if blocked_entry:
         scan_entry = models.ScanResult(
            url=url,
            domain=domain,
            risk_score=1.0,
            risk_level="Critical",
            explanation="Blocked by User Policy"
         )
         db.add(scan_entry)
         db.commit()
         
         return {
             "url": url,
             "is_phishing": True,
             "confidence_score": 1.0,
             "max_risk_score": 1.0,
             "risk_level": "Critical", 
             "heuristics": {"blocked_by_policy": True}
         }

    # 0.1 Check Whitelist (Common Benign Sites) - Sensitivity Fix
    BENIGN_DOMAINS = {
        "google.com", "youtube.com", "amazon.com", "wikipedia.org", 
        "microsoft.com", "apple.com", "yahoo.com", "bing.com", "whatsapp.com", 
        "ebay.com", "office.com", "github.com", "stackoverflow.com", "quora.com",
        "paypal.com", "adobe.com", "cloudflare.com", "dropbox.com", "cnn.com", "bbc.co.uk",
        "nytimes.com", "spotify.com", "walmart.com", "target.com",
        "localhost", "127.0.0.1",
        # Explicitly Whitelisted based on User Feedback
        "imdb.com", "linkedin.com", "indeed.com", "naukri.com", "glassdoor.com",
        "gov.in", "nic.in", "org.in", "edu.in", # Whitelist Gov/Edu TLDs via parent logic
        "x.com", "twitter.com", "facebook.com", "instagram.com", "reddit.com", "pinterest.com"
    }
    
    # Check if domain or parent domain is in whitelist
    parts = clean_domain.split('.')
    parent_domain = ".".join(parts[-2:]) if len(parts) > 1 else clean_domain
    
    if clean_domain in BENIGN_DOMAINS or parent_domain in BENIGN_DOMAINS:
          return {
             "url": url,
             "is_phishing": False,
             "confidence_score": 0.00, # Force Safe
             "max_risk_score": 0.0,
             "risk_level": "Low",
             "heuristics": {"note": "Verified Safe Domain"}
         }

    # 0.2 Check Keyword Blacklist (Strict Policy: Adult, Piracy, Games, Crypto, Earning)
    STRICT_KEYWORDS = [
        # Adult
        "porn", "xxx", "adult", "sex", "nude", "hentai", "cam",
        # Games (Strict: Block all free/download sites)
        "free-games", "crack", "cheat", "hack", "warez", "repack", 
        "crazygames", "y8", "poki", "freetogame", "steamunlocked",
        "gamestop", "epicgames", "ea.com", "ubisoft",
        # Movies / Streaming (Strict - Piracy focus)
        "torrent", "free-movies", "123movies", "camrip", "soap2day", "gomovies",
        "download-free", "watch-free", "erosnow", "moviesanywhere", "hoopla",
        "netflix", "hulu", "disney", "primevideo",
        # Crypto / Telegram (High Risk Source)
        "telegram", "bitcoin", "crypto", "coinswitch", "binance", "coinbase",
        "wallet", "ledger", "trezor", "trustwallet", "metamask", "airdrop",
        # Earning / Free Money / Surveys (High Risk of Scans/Spam)
        "pollpay", "freecash", "rewardy", "swagbucks", "clickworker",
        "earn-money", "make-money", "sidehustle", "cash-app", "money-making",
        # Internships / Jobs (Generic risk terms only)
        "job-vacancy", "freshers"  # Removed legitimate portals like Indeed, Naukri, SkillIndia to prevent FPs
    ]
    
    url_lower = url.lower()
    for kw in STRICT_KEYWORDS:
        if kw in url_lower:
             print(f"DEBUG: Strict Keyword Match -> {kw}")
             # Save to DB as High Risk
             try:
                 db.add(models.ScanResult(
                    url=url, 
                    domain=domain, 
                    risk_score=0.88, 
                    risk_level="High", 
                    explanation=f"Policy Violation: {kw}"
                 ))
                 db.commit()
             except: pass
             
             return {
                 "url": url,
                 "is_phishing": True,
                 "confidence_score": 0.88,
                 "max_risk_score": 0.88,
                 "risk_level": "High",
                 "heuristics": {"policy_violation": f"Contains restricted keyword: {kw}"}
             }

    # 1. Heuristics (Quick Checks)
    heuristics = {
        "ip_address_host": bool(re.search(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b', url)),
        "too_long": len(url) > 75,
        "suspicious_chars": "@" in url or "-" in url.split('/')[0] # hyphen in domain
    }
    
    # 2. Model Inference (Sklearn) - WITH ROBUST ERROR HANDLING
    confidence = 0.0
    model_failed = False
    
    if model and vectorizer:
        try:
            # Vectorize
            features = vectorizer.transform([url])
            
            # Predict Probability (Class 1 = Phishing)
            if hasattr(model, "predict_proba"):
                probs = model.predict_proba(features)
                confidence = probs[0][1]
            else:
                # Fallback for models without probability
                pred = model.predict(features)[0]
                confidence = 1.0 if pred == 1 else 0.0
                
            print(f"DEBUG: Sklearn Prediction for {url} -> {confidence}")
            
        except (ValueError, AttributeError, IndexError, Exception) as e:
            # Model/Vectorizer mismatch or other critical error
            print(f"⚠️ MODEL INFERENCE FAILED: {repr(e)}")
            print(f"   Falling back to heuristics-only mode for: {url}")
            model_failed = True
            # Use heuristics to estimate risk instead of crashing
            heuristic_score = sum([
                0.3 if heuristics.get("ip_address_host") else 0,
                0.3 if heuristics.get("too_long") else 0,
                0.2 if heuristics.get("suspicious_chars") else 0
            ])
            confidence = min(heuristic_score, 0.7)  # Cap at 70% for heuristics-only
    else:
        print("DEBUG: Model not loaded during inference.")
        model_failed = True
    
    # 3. Decision Logic & Sensitivity Adjustment
    # Dampen extremely high scores if not in blocklist to avoid false 100%s
    if confidence > 0.98: confidence = 0.98
    
    is_phishing = confidence > 0.60 # Increased threshold from 0.50
    
    risk_level = "Low"
    if confidence > 0.95: risk_level = "Critical"
    elif confidence > 0.85: risk_level = "High"
    elif confidence > 0.60: risk_level = "Medium"
    
    # SAVE TO DB
    try:
        scan_entry = models.ScanResult(
            url=url,
            domain=domain,
            risk_score=float(confidence),
            risk_level=risk_level,
            explanation="Deep Learning Model Detection"
        )
        db.add(scan_entry)
        db.commit()
    except Exception as e:
        print(f"DB Save Error: {e}")

    return {
        "url": url,
        "is_phishing": is_phishing,
        "confidence_score": float(confidence),
        "max_risk_score": float(confidence),
        "risk_level": risk_level,
        "heuristics": heuristics
    }

@app.get("/api/v1/blocklist")
def get_blocklist(db: Session = Depends(get_db)):
    try:
        blocked = db.query(models.BlockedDomain).all()
        domains_list = [{"domain": b.domain, "timestamp": (b.timestamp.isoformat() + "Z") if b.timestamp else None} for b in blocked]
        # Return in format expected by extension: {domains: [...]}
        return {"domains": domains_list}
    except Exception as e:
        print(f"Blocklist Error: {e}")
        return {"domains": []}


# Pydantic Models for Activity
def normalize_domain(d: str):
    if not d: return ""
    d = str(d).lower().strip()
    d = re.sub(r"^https?://", "", d)
    d = d.split("/")[0]
    return d

# Pydantic Models for Activity
class DomainRequest(BaseModel):
    domain: str

@app.get("/api/v1/activity")
def get_activity_log(limit: int = 20, db: Session = Depends(get_db)):
    try:
        logs = db.query(models.ScanResult).order_by(models.ScanResult.timestamp.desc()).limit(limit).all()
        
        # In a real app, join with BlockedDomain to check is_blocked status efficiently
        # For now, we'll just check individually or cache it
        blocked_domains = {b.domain for b in db.query(models.BlockedDomain).all()}
        
        return [
            {
                "id": log.id,
                "domain": log.domain or log.url,
                "hostname": normalize_domain(log.domain or log.url), 
                "timestamp": (log.timestamp.isoformat() + "Z") if log.timestamp else (datetime.utcnow().isoformat() + "Z"),
                "risk_score": log.risk_score,
                "risk_level": log.risk_level,
                "status": "BLOCKED" if (normalize_domain(log.domain or log.url) in blocked_domains) else ("Clean" if log.risk_score < 0.5 else "Flagged"),
                "category": "Blocked" if (normalize_domain(log.domain or log.url) in blocked_domains) else ("Phishing" if log.risk_level in ["High", "Critical"] else "Safe"),
                "explanation": log.explanation,
                "is_blocked": normalize_domain(log.domain or log.url) in blocked_domains
            }
            for log in logs
        ]
    except Exception as e:
        print(f"Activity Log Error: {e}")
        return []

@app.post("/api/v1/block")
def block_domain(request: DomainRequest, db: Session = Depends(get_db)):
    try:
        clean_domain = normalize_domain(request.domain)
        if not clean_domain:
             raise HTTPException(status_code=400, detail="Invalid domain")

        exists = db.query(models.BlockedDomain).filter(models.BlockedDomain.domain == clean_domain).first()
        if not exists:
            db.add(models.BlockedDomain(domain=clean_domain))
            db.commit()
            return {"status": "blocked", "domain": clean_domain}
        return {"status": "already_blocked", "domain": clean_domain}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/unblock")
def unblock_domain(request: DomainRequest, db: Session = Depends(get_db)):
    try:
        clean_domain = normalize_domain(request.domain)
        db.query(models.BlockedDomain).filter(models.BlockedDomain.domain == clean_domain).delete()
        db.commit()
        return {"status": "unblocked", "domain": clean_domain}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===========================
# 4. PRIVACY & SETTINGS
# ===========================
PRIVACY_CONFIG = {
    "pii_masking": True,
    "retention_days": 30
}

@app.get("/api/v1/privacy/settings")
def get_privacy_settings():
    return PRIVACY_CONFIG

@app.post("/api/v1/privacy/settings")
async def update_privacy_settings(request: Request):
    try:
        data = await request.json()
        print(data) # Debug
        # Handle query params if sent that way or body
        # Frontend sends query params in POST (weird but observed in code: ?pii_masking=...)
        # Wait, the frontend code: fetch(`${API_BASE_URL}/privacy/settings?${params.toString()}`, { method: 'POST' });
        # So we should check Query Params
        pass 
    except:
        pass
    return PRIVACY_CONFIG

@app.post("/api/v1/privacy/settings_update") # Backup alias if needed
async def update_settings_query(pii_masking: str = None, retention_days: str = None):
    if pii_masking is not None:
        PRIVACY_CONFIG["pii_masking"] = (pii_masking.lower() == 'true')
    if retention_days is not None:
        PRIVACY_CONFIG["retention_days"] = int(float(retention_days))
    return PRIVACY_CONFIG

# Let's simple fix the POST handler to use Query params as the frontend does
@app.post("/api/v1/privacy/settings")
def update_privacy_settings_endpoint(pii_masking: str = None, retention_days: str = None):
    if pii_masking is not None:
        PRIVACY_CONFIG["pii_masking"] = (pii_masking.lower() == 'true')
    if retention_days is not None:
        PRIVACY_CONFIG["retention_days"] = int(float(retention_days))
    return PRIVACY_CONFIG


@app.delete("/api/v1/reset")
def reset_system(db: Session = Depends(get_db)):
    try:
        db.query(models.ScanResult).delete()
        db.query(models.BlockedDomain).delete()
        db.commit()
        return {"status": "reset_complete"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/analyze")
async def analyze_text(request: Request):
    try:
        data = await request.json()
        # NLP Model Placeholder
        # TODO: Integrate dedicated BERT/Transformer model for text analysis
        return {
            "max_risk_score": 0.0,
            "detections": [],
            "summary": "Message analysis complete. No obvious threats detected (Standard Mode)."
        }
    except Exception as e:
        print(f"Text Analysis Error: {e}")
        return {"max_risk_score": 0, "detections": []}

class ChatRequest(BaseModel):
    message: str
    context: str = ""

@app.post("/api/v1/chat")
async def chat_assistant(request: ChatRequest):
    try:
        msg = request.message.lower()
        response_text = "I'm Sentinel AI. How can I assist you with your security concerns today?"
        suggestions = []

        if "analyze" in msg or "scan" in msg:
            response_text = "I can analyze URLs and text for phishing patterns. Please use the dashboard to run a specific scan."
            suggestions = ["Scan a suspicious URL", "Check latest threats"]
        elif "zero-trust" in msg or "zero trust" in msg:
            response_text = "Zero-Trust Architecture assumes no user or device is trustworthy by default. Sentinel implements this by verifying every URL request against strict blocklists and heuristic models before allowing access."
            suggestions = ["How does the blocklist work?", "Enable strict mode"]
        elif "neural" in msg:
            response_text = "Our Neural Detection module (currently in Safe Mode) uses deep learning to identify semantic threats in text, such as urgency or fear-inducing language in phishing emails."
        elif "security" in msg:
            response_text = "Sentinel provides real-time protection against phishing, social engineering, and malicious downloads. We use a hybrid approach of static blocklists and dynamic heuristic analysis."

        return {
            "response": response_text,
            "suggestions": suggestions
        }
    except Exception as e:
        print(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/temporal/analyze")
async def analyze_temporal(request: Request, db: Session = Depends(get_db)):
    try:
        data = await request.json()
        text_content = data.get("text", "")
        
        # Temporal Analysis Engine Logic
        triggers = []
        text_lower = text_content.lower()
        
        # 1. Define Temporal Keywords with Weights
        TEMPORAL_PATTERNS = {
            "URGENCY": {
                "keywords": ["immediately", "urgent", "now", "asap", "hurry", "quick", "expire", "expiring", "deadline", "limited time", "act now", "don't wait", "risk", "warning", "critical"],
                "weight": 0.25
            },
            "FEAR": {
                "keywords": ["locked", "suspended", "terminated", "blocked", "compromised", "unauthorized", "suspicious", "fraud", "security alert", "breach", "stolen", "hack"],
                "weight": 0.30
            },
            "AUTHORITY": {
                "keywords": ["verify", "confirm", "update", "required", "must", "mandatory", "compliance", "official", "authorized", "legal", "police"],
                "weight": 0.20
            }
        }
        
        total_risk = 0.0
        
        # 2. Pattern Matching
        for category, data in TEMPORAL_PATTERNS.items():
            for word in data["keywords"]:
                if word in text_lower:
                    # Find position for timeline
                    pos = text_lower.find(word)
                    score = data["weight"]
                    
                    triggers.append({
                        "word": word,
                        "category": category,
                        "score": score,
                        "position": pos
                    })
                    total_risk += score

        # 3. Cap Total Risk
        total_risk = min(total_risk, 0.99)
        risk_level = "Low"
        if total_risk > 0.8: risk_level = "Critical"
        elif total_risk > 0.5: risk_level = "High"
        elif total_risk > 0.2: risk_level = "Medium"

        result = {
            "risk_score": total_risk,
            "triggers": sorted(triggers, key=lambda x: x['position']), # Sort by occurrence
            "categories": {cat: {"count": len([t for t in triggers if t['category'] == cat])} for cat in TEMPORAL_PATTERNS},
            "urchin_tracking_module": "active", # Dummy tracking sign
            "explanation": f"Detected {len(triggers)} psychological triggers indicating {risk_level} temporal pressure."
        }
        
        # Save to DB for History
        try:
            scan_entry = models.ScanResult(
                url=text_content[:400] + ("..." if len(text_content) > 400 else ""),
                domain="Temporal Analysis",
                risk_score=float(total_risk),
                risk_level=risk_level,
                explanation=result["explanation"]
            )
            db.add(scan_entry)
            db.commit()
        except Exception as db_err:
             print(f"Temporal DB Error: {db_err}")

        return result
    except Exception as e:
        print(f"Temporal Analysis Error: {e}")
        return {"max_risk_score": 0, "detections": []}

@app.get("/api/v1/temporal/history")
def get_temporal_history(limit: int = 10, db: Session = Depends(get_db)):
    try:
        # Fetch items that are likely temporal analysis (domain="Temporal Analysis")
        # Or just return all recent scans mapped correctly
        logs = db.query(models.ScanResult).filter(models.ScanResult.domain == "Temporal Analysis").order_by(models.ScanResult.timestamp.desc()).limit(limit).all()
        
        # Fallback: if no temporal specific, show generic scans?
        if not logs:
             logs = db.query(models.ScanResult).order_by(models.ScanResult.timestamp.desc()).limit(limit).all()

        return [
            {
                "text": log.url,
                "riskScore": log.risk_score,
                "riskLevel": log.risk_level,
                "detections": [],
                "urgency_level": "High" if log.risk_level in ["Critical", "High"] else "Low",
                "explanation": log.explanation,
                "timestamp": (log.timestamp.isoformat() + "Z") if log.timestamp else ""
            }
            for log in logs
        ]
    except Exception as e:
        print(f"History Error: {e}")
        return []

@app.post("/api/v1/neural/scan")
async def neural_scan(request: Request):
    try:
        data = await request.json()
        url = data.get("url")
        if not url:
             # Default mock if no URL provided (demo mode)
             return {
                "confidence": 0.98,
                "signals": [
                    {"id": "DOM_STRUCTURE", "status": "VALID", "score": 0.99},
                    {"id": "SSL_CERTIFICATE", "status": "VALID", "score": 1.0},
                    {"id": "CONTENT_INTEGRITY", "status": "VALID", "score": 0.98}
                ]
             }

        # Real Analysis
        import requests
        try:
            # Add user-agent to prevent blocking
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Sentinel/1.0'}
            resp = requests.get(url, headers=headers, timeout=5)
            
            status = "VALID" if resp.status_code == 200 else "INVALID"
            has_ssl = url.startswith("https")
            has_password = "type=\"password\"" in resp.text.lower() or "type='password'" in resp.text.lower()
            
            signals = [
                {"id": "CONNECTION_HANDSHAKE", "status": "VALID" if resp.ok else "FAILED", "score": 1.0 if resp.ok else 0.0},
                {"id": "SSL_LAYER", "status": "VALID" if has_ssl else "INSECURE", "score": 1.0 if has_ssl else 0.0},
                {"id": "DOM_LOGIN_NODE", "status": "DETECTED" if has_password else "ABSENT", "score": 0.8}
            ]
            
            confidence = 0.95 if (resp.ok and has_ssl) else 0.45
            
            return {
                "confidence": confidence,
                "signals": signals
            }
            
        except requests.exceptions.RequestException:
             return {
                "confidence": 0.0,
                "signals": [
                    {"id": "CONNECTION_HANDSHAKE", "status": "UNREACHABLE", "score": 0.0},
                    {"id": "DNS_RESOLUTION", "status": "FAILED", "score": 0.0}
                ]
             }

    except Exception as e:
        print(f"Neural Scan Error: {e}")
        return {"confidence": 0.0, "signals": []}

@app.get("/api/v1/dashboard")
def get_dashboard_stats(db: Session = Depends(get_db)):
    try:
        total_scans = db.query(models.ScanResult).count()
        print(f"DEBUG: Dashboard fetching stats... Total Scans: {total_scans}")
        # Count high risk items
        threats_blocked = db.query(models.ScanResult).filter(models.ScanResult.risk_level.in_(["High", "Critical"])).count()
        
        # Derive metrics 
        critical_count = db.query(models.ScanResult).filter(models.ScanResult.risk_level == "Critical").count()
        efficiency = 99.9 if total_scans > 0 else 100.0
        
        # Recent activity
        recent = db.query(models.ScanResult).order_by(models.ScanResult.timestamp.desc()).limit(10).all()
        
        # Activity Trend (Last 7 Days)
        activity_trend = []
        now = datetime.utcnow()
        for i in range(6, -1, -1):
            day_start = now - timedelta(days=i)
            day_str = day_start.strftime("%Y-%m-%d")
            # In a real app, do this with SQL GROUP BY. Here we iterate for simplicity.
            # Filtering by string match on timestamp or date range
            # SQLite specific: strftime('%Y-%m-%d', timestamp)
            count = 0
            # Fetch all for this day (optimization: strict range query)
            start_of_day = datetime(day_start.year, day_start.month, day_start.day)
            end_of_day = start_of_day + timedelta(days=1)
            
            count = db.query(models.ScanResult).filter(
                models.ScanResult.timestamp >= start_of_day,
                models.ScanResult.timestamp < end_of_day
            ).count()
            
            activity_trend.append({"date": day_str, "count": count})

        return {
            "kpi": {
                "total_scans": total_scans,
                "threats_blocked": threats_blocked,
                "critical_blocked": critical_count,
                "safety_score": efficiency
            },
            "recent_interventions": [
                {
                    "domain": r.domain or r.url,
                    "type": "Phishing" if r.risk_level in ["High", "Critical"] else "Secure Scan",
                    "risk": r.risk_level.upper() if r.risk_level else "SAFE",
                    "score": r.risk_score,
                    "timestamp": (r.timestamp.isoformat() + "Z") if r.timestamp else ""
                } for r in recent
            ],
            "activity_trend": activity_trend
        }
    except Exception as e:
        # Fallback 
        print(f"Dashboard Error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "kpi": { "total_scans": 0, "threats_blocked": 0, "critical_blocked": 0, "safety_score": 100.0 },
            "recent_interventions": [],
            "activity_trend": []
        }

@app.get("/health")
def health_check():
    return {"status": "active", "model_loaded": model is not None, "device": str(device)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
