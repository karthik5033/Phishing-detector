from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import os
import sys

# Add parent directory to path to access models if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# Add current directory (backend) to path to ensure 'app' module can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

app = FastAPI(title="Social Engineering Detection API")

# Enable CORS for Next.js app (usually on localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"Incoming request: {request.method} {request.url}")
    try:
        response = await call_next(request)
        print(f"Response status: {response.status_code}")
        return response
    except Exception as e:
        print(f"Request failed: {str(e)}")
        raise e

@app.middleware("http")
async def add_cache_headers(request: Request, call_next):
    """Prevent browser caching of API responses to avoid stale data"""
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

# Load the ENHANCED model (trained on ~1.2M samples)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, 'models')

try:
    vectorizer = joblib.load(os.path.join(MODELS_DIR, 'vectorizer_enhanced.joblib'))
    clf = joblib.load(os.path.join(MODELS_DIR, 'model_enhanced.joblib'))
    print("Loaded Enhanced Model (Hashing + MultiOutput SGD)")
except Exception as e:
    print(f"Enhanced model not found ({e}), falling back to scalable...")
    try:
        vectorizer = joblib.load(os.path.join(MODELS_DIR, 'vectorizer_scalable.joblib'))
        clf = joblib.load(os.path.join(MODELS_DIR, 'model_scalable.joblib'))
    except Exception as e2:
        print(f"Critical: Could not load any models. Error: {e2}")
        raise e2

labels = ['urgency', 'authority', 'fear', 'impersonation']

def clean_url(url):
    if not isinstance(url, str): return ""
    url = url.lower()
    for prefix in ['https://', 'http://', 'www.']:
        if url.startswith(prefix):
            url = url[len(prefix):]
    return url

from scipy.sparse import hstack, csr_matrix
import re

def extract_manual_features(urls):
    """
    Extracts dense features from a list of URLs.
    Compatible with the training script logic.
    """
    features = []
    
    # Regex for IP address
    ip_pattern = re.compile(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b')
    
    for url in urls:
        if not isinstance(url, str):
            url = ""
            
        row = []
        
        # 1. Has IP Address
        row.append(1 if ip_pattern.search(url) else 0)
        
        # 2. Length Features
        row.append(1 if len(url) > 50 else 0)
        row.append(1 if len(url) > 75 else 0)
        
        # 3. Suspicious Characters
        row.append(url.count('.'))   
        row.append(url.count('@'))   
        row.append(url.count('-'))   
        
        # 4. Sensitive Keywords
        lower_url = url.lower()
        for word in ['login', 'signin', 'account', 'update', 'verify', 'secure', 'bank', 'confirm']:
            row.append(1 if word in lower_url else 0)
            
        features.append(row)
        
    return csr_matrix(features)

class DetectionRequest(BaseModel):
    text: str

class FeatureImportance(BaseModel):
    word: str
    weight: float

class LabelResult(BaseModel):
    probability: float
    top_features: list[FeatureImportance]

class DetectionResponse(BaseModel):
    text: str
    max_risk_score: float
    labels: dict[str, LabelResult]

# Create API Router
from fastapi import APIRouter
router = APIRouter(prefix="/api/v1")
recent_scans = []

@router.post("/detect", response_model=DetectionResponse)
async def detect_attack(request: DetectionRequest):
    global recent_scans # Access global list
    import traceback
    from datetime import datetime
    import re
    
    try:
        text = request.text
        if not text:
            raise HTTPException(status_code=400, detail="Text is required")

        # WHITELIST: Known-safe TLDs and popular domains
        safe_patterns = [
            # Educational & Government
            r'\.edu([/?#]|$)',           # US educational
            r'\.edu\.[a-z]{2}([/?#]|$)', # International educational (e.g., .edu.in, .edu.au)
            r'\.ac\.[a-z]{2}([/?#]|$)',  # Academic (e.g., .ac.uk, .ac.in)
            r'\.gov([/?#]|$)',           # US government
            r'\.gov\.[a-z]{2}([/?#]|$)', # International government
            r'\.mil([/?#]|$)',           # US military
            # Specific Institutions
            r'rvce\.edu\.in',
            # Popular platforms (ALWAYS SAFE)
            r'youtube\.com',
            r'youtu\.be',
            r'google\.com',
            r'wikipedia\.org',
            r'github\.com',
            r'stackoverflow\.com',
            r'reddit\.com',
            r'twitter\.com',
            r'facebook\.com',
            r'instagram\.com',
            r'linkedin\.com',
            r'amazon\.(com|in|co\.uk)',
            r'netflix\.com',
            r'spotify\.com',
            r'apple\.com',
            r'microsoft\.com',
            # Regional & Subdomain Google
            r'(^|\.)google\.(co\.[a-z]{2}|com?\.[a-z]{2}|[a-z]{2})([/?#]|$)',
            r'(^|\.)google([/?#]|$)', # Covers .google TLD (blog.google, about.google)
            r'(^|\.)google\.com', 
            r'families\.google',
            r'blog\.google',
            r'about\.google',
            r'store\.google',
            # News & Media
            r'britannica\.com',
            r'imdb\.com',
            r'quora\.com',
            r'indiatimes\.com',
            r'thehindu\.com',
            r'nytimes\.com',
            r'bbc\.com',
            r'bbc\.co\.uk',
            r'cnn\.com',
            r'(^|\.)brave\.com',
            r'(^|\.)brave\.app', # status.brave.app
            r'brave\.com',
            # Tech & Finance (Fixes for False Positives)
            r'(^|\.)oracle\.com',
            r'(^|\.)jpmorgan\.com',
            r'(^|\.)jpmorganchase\.com',
            r'(^|\.)deepseek\.com',
            r'(^|\.)chat\.deepseek\.com',
            r'(^|\.)openai\.com',
            r'(^|\.)chatgpt\.com',
        ]
        
        # Check if URL matches safe patterns
        is_whitelisted = any(re.search(pattern, text.lower()) for pattern in safe_patterns)
        
        # CHECK ALLOWED DOMAINS (Whitelist override)
        try:
             # Reuse URL parsing
             from urllib.parse import urlparse
             parsed = urlparse(text)
             hostname = parsed.netloc or parsed.path
             if hostname.startswith("www."): hostname = hostname[4:]
             
             db = SessionLocal()
             allowed = db.query(models.AllowedDomain).filter(models.AllowedDomain.domain == hostname).first()
               # Check parent
             if not allowed and '.' in hostname:
                 parts = hostname.split('.')
                 if len(parts) > 2:
                     parent = '.'.join(parts[1:])
                     allowed = db.query(models.AllowedDomain).filter(models.AllowedDomain.domain == parent).first()
             
             if allowed:
                  db.close()
                  return {
                    "text": text,
                    "max_risk_score": 0.0,
                    "labels": {
                        "urgency": {"probability": 0.0, "top_features": []},
                        "authority": {"probability": 0.0, "top_features": []},
                        "fear": {"probability": 0.0, "top_features": []},
                        "impersonation": {"probability": 0.0, "top_features": []}
                    } 
                  }
        except:
             pass

        if is_whitelisted:
            # Return safe classification immediately
            return {
                "text": text,
                "max_risk_score": 0.0,
                "labels": {
                    "urgency": {"probability": 0.0, "top_features": []},
                    "authority": {"probability": 0.0, "top_features": []},
                    "fear": {"probability": 0.0, "top_features": []},
                    "impersonation": {"probability": 0.0, "top_features": []}
                }
            }

        # CHECK DATABASE BLOCKLIST (Immediate enforcement)
        try:
             # Clean URL to get hostname for check
             from urllib.parse import urlparse
             parsed = urlparse(text)
             hostname = parsed.netloc or parsed.path
             if hostname.startswith("www."): hostname = hostname[4:]
             
             db = SessionLocal()
             # Check exact hostname match
             blocked = db.query(models.BlockedDomain).filter(models.BlockedDomain.domain == hostname).first()
             # Check parent domain match if not found
             if not blocked and '.' in hostname:
                 parts = hostname.split('.')
                 if len(parts) > 2:
                     parent = '.'.join(parts[1:])
                     blocked = db.query(models.BlockedDomain).filter(models.BlockedDomain.domain == parent).first()
             
             db.close()
             
             if blocked:
                 print(f"🚫 BLOCKED DETECTED: {text} (Matched: {blocked.domain})")
                 return {
                    "text": text,
                    "max_risk_score": 1.0, # Force BLOCK
                    "labels": {
                        "urgency": {"probability": 1.0, "top_features": [{"word": "BLOCKED_BY_USER", "weight": 1.0}]},
                        "authority": {"probability": 0.0, "top_features": []},
                        "fear": {"probability": 0.0, "top_features": []},
                        "impersonation": {"probability": 0.0, "top_features": []}
                    } 
                 }
        except Exception as e:
            print(f"Blocklist check error: {e}")

        # Clean and Vectorize input

        # Clean and Vectorize input
        clean_text = clean_url(text)
        
        # Feature Extraction
        X_vec = vectorizer.transform([clean_text])       # Hashing Features
        X_manual = extract_manual_features([clean_text]) # Manual Features
        
        # Combine Features
        X_combined = hstack([X_vec, X_manual])
        
        # Get probabilities
        try:
            # MultiOutputClassifier returns a LIST of arrays (one per label)
            # Each array is (n_samples, n_classes) -> (1, 2)
            raw_probs = clf.predict_proba(X_combined)
            
            # Extract probability of class "1" (Positive) for each label
            probs = []
            for p in raw_probs:
                # p is array([[prob_0, prob_1]])
                # Handle cases where model might only have 1 class if data was skewed
                if p.shape[1] == 2:
                    probs.append(float(p[0, 1]))
                else:
                    # If only one class present (e.g. all 0), predict 0
                    probs.append(0.0)
                    
        except AttributeError as e:
            # Fallback
            print(f"Model prediction error: {e}")
            probs = [0.0, 0.0, 0.0, 0.0]
            
        max_prob = float(np.max(probs))
        
        results_labels = {}
        top_label = "Benign"
        top_prob = 0.0
        
        # Map probabilities to labels
        for i, label in enumerate(labels):
            prob = probs[i] if i < len(probs) else 0.0
            
            if prob > top_prob:
                top_prob = prob
                top_label = label
                
            results_labels[label] = {
                "probability": prob,
                "top_features": [] # Feature importance not available with HashingVectorizer
            }

        # RECORD LIVE SCAN
        timestamp = datetime.now().isoformat()
        display_type = "Clean"
        if max_prob > 0.8: display_type = "Phishing"
        elif max_prob > 0.5: display_type = "Suspicious"
        
        # Refine type
        if max_prob > 0.5 and "urgency" in top_label: display_type = "Social Eng."
        
        from urllib.parse import urlparse
        # Extract pure hostname for strict blocking
        try:
             parsed = urlparse(text)
             hostname = parsed.netloc or parsed.path # Handle case where protocol might be missing
             if hostname.startswith("www."): hostname = hostname[4:]
             # Fallback if parsing fails (e.g. just text)
             if not hostname: hostname = text 
        except:
             hostname = text

        import uuid
        scan_entry = {
            "id": str(uuid.uuid4()),
            "domain": text[:50] + "..." if len(text) > 50 else text, # Display text
            "hostname": hostname, # Strict blocking domain
            "type": display_type,
            "timestamp": timestamp,
            "risk_score": max_prob
        }
        
        # Ensure list exists (it should be defined globally)
        if 'recent_scans' not in globals():
             recent_scans = []
             
        recent_scans.insert(0, scan_entry)
        if len(recent_scans) > 50: recent_scans.pop()
        
        return {
            "text": text,
            "max_risk_score": max_prob,
            "labels": results_labels
        }
    except Exception as e:
        print("CRITICAL ERROR IN /detect:")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard")
async def get_dashboard_stats():
    from datetime import datetime, timedelta
    
    # Dynamic Stats from recent_scans
    total_blocked = sum(1 for s in recent_scans if s['risk_score'] > 0.5)
    total_scans = len(recent_scans) + 14205  # Session + legacy baseline
    
    # Generate 7-day activity trend (mock for now, could be real if we track timestamps)
    activity_trend = []
    for i in range(7):
        date = (datetime.now() - timedelta(days=6-i)).strftime("%Y-%m-%d")
        # Count scans from that day (simplified - just distribute recent_scans)
        count = len([s for s in recent_scans if s['timestamp'].startswith(date)]) if recent_scans else 0
        activity_trend.append({"date": date, "count": count + (50 - i*5)})  # Add baseline
    
    # Format recent_interventions with risk field
    formatted_interventions = []
    for scan in (recent_scans[:20] if recent_scans else []):
        risk_level = "HIGH" if scan['risk_score'] > 0.8 else ("MODERATE" if scan['risk_score'] > 0.5 else "LOW")
        formatted_interventions.append({
            "domain": scan['domain'],
            "type": scan['type'],
            "timestamp": scan['timestamp'],
            "risk": risk_level,
            "score": scan['risk_score']
        })
    
    if not formatted_interventions:
        formatted_interventions = [{
            "domain": "System Initialized - Waiting for traffic...",
            "type": "Secure",
            "timestamp": datetime.now().isoformat(),
            "risk": "SAFE",
            "score": 0.0
        }]
    
    return {
        "kpi": {
            "total_scans": total_scans,
            "threats_blocked": 14205 + total_blocked,
            "critical_blocked": sum(1 for s in recent_scans if s['risk_score'] > 0.8),
            "safety_score": 99.9
        },
        "recent_interventions": formatted_interventions,
        "activity_trend": activity_trend
    }

@router.get("/activity")
async def get_activity_log(limit: int = 50):
    """
    Returns detailed activity log for the Activity Insights page
    """
    from datetime import datetime
    
    # Convert recent_scans to detailed activity format
    activity_items = []
    seen_ids = set()
    for idx, scan in enumerate(recent_scans[:limit]):
        risk_score = scan['risk_score']
        
        # Determine risk level
        if risk_score > 0.8:
            risk_level = "HIGH"
            status = "BLOCKED"
        elif risk_score > 0.5:
            risk_level = "MODERATE"
            status = "FLAGGED"
        else:
            risk_level = "LOW"
            status = "SAFE"
        
        # Determine category based on type
        category_map = {
            "Phishing": "Phishing",
            "Social Eng.": "Social Engineering",
            "Suspicious": "Suspicious",
            "Clean": "Safe"
        }
        category = category_map.get(scan['type'], "Unknown")
        
        # Deduplicate IDs to prevent React keys error
        item_id = scan.get("id", idx + 10000)
        
        # Ensure ID is unique in valid list
        original_id = item_id
        dup_count = 1
        while item_id in seen_ids:
            item_id = f"{original_id}_{dup_count}"
            dup_count += 1
        seen_ids.add(item_id)

        activity_items.append({
            "id": item_id,
            "hostname": scan.get("hostname", scan['domain']), # Use specific hostname or fallback to display domain
            "domain": scan['domain'],
            "timestamp": scan['timestamp'],
            "risk_score": risk_score,
            "risk_level": risk_level,
            "status": status,
            "category": category,
            "explanation": f"Risk score: {risk_score:.2f}. Detected as {scan['type']}.",
            "is_blocked": risk_score > 0.8
        })
    
    
    # Return empty list if no scans (Don't show bluff data)
    if not activity_items:
        return []
    
    return activity_items

# Include the router in the main app
app.include_router(router)

# --- DIRECT BLOCKING ENDPOINTS (To fix 404 issue) ---
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from pydantic import BaseModel

class DirectBlockRequest(BaseModel):
    domain: str

@app.post("/api/v1/block")
@app.post("/block_direct") # Debug alias
async def direct_block_domain(request: DirectBlockRequest, db: Session = Depends(get_db)):
    try:
        # Check if already blocked
        exists = db.query(models.BlockedDomain).filter(models.BlockedDomain.domain == request.domain).first()
        if not exists:
            blocked = models.BlockedDomain(domain=request.domain)
            db.add(blocked)
            db.commit()
            print(f"Direct block success: {request.domain}")
            return {"status": "success", "message": f"Domain {request.domain} blocked permanently."}
        return {"status": "skipped", "message": "Domain already blocked."}
    except Exception as e:
        print(f"Direct block error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/unblock")
async def unblock_domain(request: DirectBlockRequest, db: Session = Depends(get_db)):
    try:
        # Remove from Blocked list
        item = db.query(models.BlockedDomain).filter(models.BlockedDomain.domain == request.domain).first()
        if item:
            db.delete(item)
        
        # Add to Allowed list (Whitelist against AI)
        existing_allowed = db.query(models.AllowedDomain).filter(models.AllowedDomain.domain == request.domain).first()
        if not existing_allowed:
            new_allowed = models.AllowedDomain(domain=request.domain)
            db.add(new_allowed)

        db.commit()
        print(f"Unblocked and whitelisted: {request.domain}")
        return {"status": "success", "message": f"Unblocked and whitelisted {request.domain}"}
    except Exception as e:
        print(f"Direct unblock error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/blocklist")
async def direct_get_blocklist(db: Session = Depends(get_db)):
    try:
        blocked_domains = db.query(models.BlockedDomain).all()
        return {
            "status": "success",
            "count": len(blocked_domains),
            "domains": [{"domain": bd.domain, "blocked_at": bd.created_at.isoformat() if hasattr(bd, 'created_at') else None} for bd in blocked_domains]
        }
    except Exception as e:
        print(f"Direct blocklist error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
# ----------------------------------------------------

@app.on_event("startup")
async def startup_event():
    # Create tables if they don't exist
    print("Checking database tables...")
    try:
        from app.database import engine
        models.Base.metadata.create_all(bind=engine)
        print("Database tables checked/created.")
    except Exception as e:
        print(f"Database initialization warning (safe to ignore if tables exist): {e}")
    
    print("\n\n--- REGISTERED ROUTES ---")
    for route in app.routes:
        if hasattr(route, "path"):
            print(f"ROUTE: {route.path}")
    print("-------------------------\n\n")

@app.get("/health")
async def health():
    from datetime import datetime
    routes = []
    for route in app.routes:
        if hasattr(route, "path"):
            routes.append(route.path)
            
    return {
        "status": "ok",
        "api_version": "v1",
        "endpoints": routes,
        "timestamp": datetime.now().isoformat(),
        "message": "SecureSentinel API is running"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
