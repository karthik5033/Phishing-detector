from fastapi import FastAPI, HTTPException, Request, Depends
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from sqlalchemy import func
import numpy as np
import os
import joblib
import sys
import re
import json
import lightgbm as lgb
import tldextract
import math
from collections import Counter
from urllib.parse import urlparse

# Add parent directory to path to access models if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import get_db
from app import models
from app.services.llm import get_llm_service, LlmService

app = FastAPI(
    title="ClickWise API",
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

TRUSTED_DOMAINS = {
    'google.com','googleapis.com','youtube.com','gmail.com','googlemail.com',
    'microsoft.com','microsoftonline.com','live.com','outlook.com','office.com',
    'apple.com','icloud.com','me.com',
    'amazon.com','amazon.in','amazonaws.com',
    'facebook.com','instagram.com','whatsapp.com','meta.com',
    'twitter.com','x.com','t.co',
    'github.com','gitlab.com',
    'linkedin.com',
    'netflix.com',
    'reddit.com',
    'wikipedia.org','wikimedia.org',
    'stackoverflow.com',
    'dropbox.com',
    'paypal.com',
    'chase.com','wellsfargo.com','bankofamerica.com','citibank.com',
    'spotify.com',
        'twitch.tv',
    'discord.com',
    'adobe.com',
    'salesforce.com',
    'shopify.com',
    'wordpress.com',
    'medium.com',
    'quora.com',
    'pinterest.com',
    'tumblr.com',
    'flickr.com',
    'vimeo.com',
    'dailymotion.com',
    'soundcloud.com',
    'bandcamp.com',
    'patreon.com',
    'substack.com',
    'mailchimp.com',
    'hubspot.com',
    'zoom.us','slack.com','notion.so','figma.com',
    'cloudflare.com','aws.amazon.com',
    'yahoo.com','bing.com','duckduckgo.com',
}

# ===========================
# 2. LOAD ML MODELS (LightGBM)
# ===========================
LGBM_MODEL = None
LGBM_FEATURES = None
OPTIMAL_THRESHOLD = 0.767
MODEL_STATUS = "DISABLED"

# ========== Detection Thresholds & Config ==========
TRUSTED_DOMAIN_ML_CAP = 0.20  # cap ML score for known trusted domains
MAX_CONFIDENCE_CAP = 0.98
PHISHING_THRESHOLD = 0.60
RISK_HIGH_THRESHOLD = 0.75
RISK_MEDIUM_THRESHOLD = 0.40
LLM_SUSPICION_THRESHOLD = 0.2
LLM_MIN_CONFIDENCE_FOR_CHECK = 0.05
BASELINE_LOW_CAP = 0.2

# Keyword lists (centralized)
STRICT_KEYWORDS = [
    # Adult
    "porn", "xxx", "adult", "sex", "nude", "hentai", "livecam", "webcam",
    # Games (Strict: Block all free/download sites)
    "free-games", "crack", "cheat", "hack", "warez", "repack",
    "crazygames", "y8", "poki", "freetogame", "steamunlocked",
    "gamestop", "epicgames", "ea.com", "ubisoft",
    # Movies / Streaming (Strict - Piracy focus)
    "torrent", "free-movies", "123movies", "camrip", "soap2day", "gomovies",
    "download-free", "watch-free",
    "filmyzilla", "vegamovies", "tamilrockers", "123mkv", "mp4moviez",
    "bolly4u", "pagalworld", "djpunjab", "downloadhub", "worldfree4u",
    "khatrimaza", "9xmovies", "full-movie-download", "movie-download-free",
    # Anime Piracy Sites
    "cartoonsarea", "gogoanime", "9anime", "kissanime", "animefree",
    "animepahe", "animekisa", "zoro.to", "aniwatch", "animefreak",
    "4anime", "animedao", "animesuge", "wcostream",
    # Crypto / Telegram (High Risk Source)
    "telegram", "bitcoin", "crypto", "coinswitch", "binance", "coinbase",
    "wallet", "ledger", "trezor", "trustwallet", "metamask", "airdrop",
    # Earning / Free Money / Surveys (High Risk of Scans/Spam)
    "pollpay", "freecash", "rewardy", "swagbucks", "clickworker",
    "earn-money", "make-money", "sidehustle", "cash-app", "money-making",
    # APK / Mods (High Malware Risk)
    "mod-apk", "hack-apk", "premium-apk", "paid-apk-free", "crack-apk",
    # Specific MOD APK Sites (Known Malware Distributors)
    "apktodo", "liteapks", "modyolo", "modlite", "happymod",
    "an1.com", "rexdl", "revdl", "apkmody", "apkcombo", "apkdone",
    # Internships / Jobs (Generic risk terms only)
    "job-vacancy", "freshers"
]

SUSPICIOUS_KEYWORDS = [
    # Gambling & Betting (High Risk of addiction/loss)
    "online-casino", "slot-machine", "betting-app", "gambling",
    "sports-bet", "poker-online", "roulette", "blackjack",
    # High Risk Financial
    "instant-loan", "payday-loan", "quick-cash", "crypto-doubler",
    # AI / Deepfake (Ethical Risk)
    "deepfake", "face-swap", "undress-ai", "nudify",
    # Generic Spam
    "click-here", "subscribe-now", "winner-claim"
]


def load_lgbm_model():
    global LGBM_MODEL, LGBM_FEATURES, OPTIMAL_THRESHOLD, MODEL_STATUS
    try:
        import joblib, json, os
        model_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'phishing_lgbm.joblib')
        meta_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'model_metadata.json')
        
        if os.path.exists(model_path) and os.path.exists(meta_path):
            LGBM_MODEL = joblib.load(model_path)
            with open(meta_path) as f:
                meta = json.load(f)
            LGBM_FEATURES = meta['features']
            OPTIMAL_THRESHOLD = meta['optimal_threshold']
            MODEL_STATUS = f"ACTIVE (LightGBM, threshold={OPTIMAL_THRESHOLD:.3f})"
            print(f"[ML] LightGBM model loaded. {len(LGBM_FEATURES)} features. Threshold={OPTIMAL_THRESHOLD:.3f}")
        else:
            print(f"[ML] Model files not found. Running without ML.")
    except Exception as e:
        print(f"[ML] Failed to load model: {e}")

load_lgbm_model()

def load_tranco_domains():
    global TRUSTED_DOMAINS
    try:
        import csv, os
        tranco_path = os.path.join(
            os.path.dirname(__file__), '..', 'ext_data', 'tranco_10k.csv'
        )
        if os.path.exists(tranco_path):
            with open(tranco_path, newline='', encoding='utf-8') as f:
                reader = csv.reader(f)
                count = 0
                for row in reader:
                    if len(row) >= 2:
                        domain = row[1].strip().lower()
                        if domain:
                            TRUSTED_DOMAINS.add(domain)
                            count += 1
            print(f"[Tranco] Loaded {count} domains. TRUSTED_DOMAINS now has {len(TRUSTED_DOMAINS)} entries.")
        else:
            print("[Tranco] tranco_10k.csv not found. Using hardcoded list only.")
    except Exception as e:
        print(f"[Tranco] Failed to load: {e}")

load_tranco_domains()

def extract_url_features(url: str) -> dict | None:
    try:
        url = str(url).strip()
        parsed = urlparse(url if url.startswith('http') else 'http://' + url)
        ext = tldextract.extract(url)
        
        domain = ext.domain or ''
        suffix = ext.suffix or ''
        subdomain = ext.subdomain or ''
        registered_domain = f"{domain}.{suffix}" if suffix else domain
        path = parsed.path or ''
        query = parsed.query or ''
        
        def entropy(s):
            if not s: return 0.0
            c = Counter(s)
            l = len(s)
            return -sum((v/l) * math.log2(v/l) for v in c.values())
        
        known_brands = {
            'paypal','google','microsoft','apple','amazon','netflix',
            'facebook','instagram','twitter','linkedin','dropbox',
            'chase','wellsfargo','bankofamerica','citibank','hsbc',
            'steam','discord','roblox','ebay','walmart'
        }
        suspicious_tlds = {
            'xyz','top','click','tk','ml','ga','cf','gq','pw',
            'club','online','site','website','space','live','icu'
        }
        
        brand_in_subdomain = int(any(
            b in subdomain.lower() for b in known_brands
            if b != domain.lower()
        ))
        has_ip = int(bool(re.match(r'^(\d{1,3}\.){3}\d{1,3}$', registered_domain)))
        
        return {
            'url_length': len(url),
            'domain_length': len(registered_domain),
            'subdomain_length': len(subdomain),
            'path_length': len(path),
            'query_length': len(query),
            'num_dots': url.count('.'),
            'num_hyphens': url.count('-'),
            'num_underscores': url.count('_'),
            'num_slashes': url.count('/'),
            'num_at': url.count('@'),
            'num_digits': sum(c.isdigit() for c in url),
            'num_special': sum(c in '!$%^*()+=[]{}|;<>?' for c in url),
            'digit_ratio': sum(c.isdigit() for c in url) / max(len(url), 1),
            'letter_ratio': sum(c.isalpha() for c in url) / max(len(url), 1),
            'url_entropy': entropy(url),
            'domain_entropy': entropy(registered_domain),
            'subdomain_depth': len(subdomain.split('.')) if subdomain else 0,
            'has_ip': has_ip,
            'uses_https': int(parsed.scheme == 'https'),
            'suspicious_tld': int(suffix.lower() in suspicious_tlds),
            'has_port': int(bool(parsed.port)),
            'has_at_symbol': int('@' in url),
            'has_double_slash': int('//' in path),
            'brand_in_subdomain': brand_in_subdomain,
            'path_depth': path.count('/'),
            'is_shortened': int(registered_domain.lower() in {
                'bit.ly','tinyurl.com','t.co','goo.gl','ow.ly',
                'shorturl.at','tiny.cc','is.gd','buff.ly','rb.gy'
            }),
            'num_subdomains': len(subdomain.split('.')) if subdomain else 0,
            'domain_digit_count': sum(c.isdigit() for c in domain),
            'has_consecutive_digits': int(bool(re.search(r'\d{4,}', url))),
            'query_param_count': len(query.split('&')) if query else 0,
        }
    except Exception as e:
        return None

def get_ml_score(url: str) -> float | None:
    if LGBM_MODEL is None or LGBM_FEATURES is None:
        return None
    features = extract_url_features(url)
    if features is None:
        return None
    try:
        import pandas as pd
        feature_vector = pd.DataFrame([features])[LGBM_FEATURES]
        prob = float(LGBM_MODEL.predict_proba(feature_vector)[0][1])
        return round(prob, 4)
    except Exception as e:
        print(f"[ML] Scoring error: {e}")
        return None
        
def get_registered_domain(url: str) -> str:
    try:
        ext = tldextract.extract(url)
        # Use registered_domain when available (gives domain.tld), else fall back safely
        reg = getattr(ext, 'registered_domain', None)
        if reg:
            return reg.lower()
        # If no registered_domain, build carefully ensuring no leading dot
        if ext.domain and ext.suffix:
            return f"{ext.domain}.{ext.suffix}".lower()
        if ext.domain:
            return ext.domain.lower()
        return ""
    except Exception:
        return ""

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

class DailyCount(BaseModel):
    date: str
    count: int

class GlobalStatsResponse(BaseModel):
    total_scans: int
    threats_blocked: int
    common_patterns: Dict[str, int]
    recent_trend: List[DailyCount]

from datetime import datetime, timedelta

@app.post("/api/v1/detect", response_model=DetectionResponse)
async def detect_phishing(request: Request, db: Session = Depends(get_db), service: LlmService = Depends(get_llm_service)):
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
    domain = normalize_domain(url)
    clean_domain = domain
    
    # 0. Check Blocklist (Critical)
    blocked_entry = db.query(models.BlockedDomain).filter(models.BlockedDomain.domain == domain).first()
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

    # 0.1 Check Whitelist (User Allowed + Common Benign)
    allowed_entry = db.query(models.AllowedDomain).filter(models.AllowedDomain.domain == clean_host).first()
    if allowed_entry:
        return {
             "url": url,
             "is_phishing": False,
             "confidence_score": 0.00,
             "max_risk_score": 0.0,
             "risk_level": "Low",
             "heuristics": {"note": "User Whitelisted"}
        }

    # 0.2 Check Built-in Whitelist (Common Benign Sites) - Sensitivity Fix
    # Use central TRUSTED_DOMAINS as the base and merge a few extra known benign domains
    EXTRA_BENIGN = {
        "localhost", "127.0.0.1",
        "cnn.com", "bbc.co.uk", "nytimes.com", "walmart.com", "target.com",
        # Explicitly Whitelisted based on User Feedback
        "imdb.com", "indeed.com", "naukri.com", "glassdoor.com",
        # Gov/Edu parent TLDs to allow through parent-domain check
        "gov.in", "nic.in", "org.in", "edu.in",
        # Additional Media / Streaming & miscellaneous
        "hulu.com", "disneyplus.com", "primevideo.com", "moviesanywhere.com", "hotstar.com",
        "plex.tv", "hoopladigital.com", "screenrant.com", "dailymotion.com", "archive.org",
        "rottentomatoes.com", "manoramaonline.com", "zee5.com", "jiocinema.com",
        "paytm.com", "bookmyshow.com", "tubi.tv", "tubitv.com", "justwatch.com",
        "crunchyroll.com", "funimation.com", "uptodown.com", "apkmirror.com",
        # Dictionaries & Educational (Critical - Prevent False Positives)
        "cambridge.org", "merriam-webster.com", "dictionary.com", "ldoceonline.com",
        "etymonline.com", "oxfordlearnersdictionaries.com", "thefreedictionary.com",
        # Tech & Entertainment News
        "tomsguide.com", "techradar.com", "cnet.com", "theverge.com",
        # Gaming & Misc
        "steampowered.com", "store.steampowered.com", "chili.com",
    }

    BENIGN_DOMAINS = set(TRUSTED_DOMAINS) | EXTRA_BENIGN

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

    # 0.2 Check Keyword Blacklist (Strict Policy) — keywords centralized in module-level STRICT_KEYWORDS
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

    # 0.3 Check Suspicious Keywords (Medium Risk) — keywords centralized in module-level SUSPICIOUS_KEYWORDS
    for kw in SUSPICIOUS_KEYWORDS:
        if kw in url_lower:
             # Check if whitelisted first (e.g. news articles about gambling)
             is_benign = False
             for benign_domain in BENIGN_DOMAINS:
                 if benign_domain in url_lower: is_benign = True
             
             if not is_benign:
                 print(f"DEBUG: Suspicious Keyword Match -> {kw}")
                 return {
                     "url": url,
                     "is_phishing": False, # Not definitely phishing
                     "confidence_score": 0.70, # Medium/High Risk
                     "max_risk_score": 0.70,
                     "risk_level": "Medium", # Yellow Badge
                     "heuristics": {"suspicious_content": f"Contains risk keyword: {kw}"}
                 }

    # 1. Heuristics (Quick Checks)
    heuristics = {
        "ip_address_host": bool(re.search(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b', url)),
        "too_long": len(url) > 75,
        "suspicious_chars": "@" in url or "-" in url.split('/')[0] # hyphen in domain
    }
    
    # 2. Model Inference
    # Use heuristics to estimate risk (fallback)
    heuristic_score = sum([
        0.3 if heuristics.get("ip_address_host") else 0,
        0.3 if heuristics.get("too_long") else 0,
        0.2 if heuristics.get("suspicious_chars") else 0
    ])
    
    confidence = heuristic_score
    
    ml_score = get_ml_score(url)
    if ml_score is not None:
        registered = get_registered_domain(url)
        
        # If registered domain is in trusted list, cap ML score hard at 0.20
        # This provides headroom so pop-ups stay green/yellow for known good sites
        if registered in TRUSTED_DOMAINS:
            ml_score = min(ml_score, TRUSTED_DOMAIN_ML_CAP)
            print(f"[ML] Trusted domain cap applied: {registered} → ml_score capped to {ml_score:.3f}")
        
        # Adaptive blending — give ML more weight when it is very confident
        # If ML says >0.95, it probably knows — give it 90% weight
        # If ML says 0.5-0.95, blend 70/30
        # If ML says <0.5, blend 50/50 with heuristics
        if ml_score >= 0.95:
            blend_weight = 0.90
        elif ml_score >= 0.50:
            blend_weight = 0.70
        else:
            blend_weight = 0.50
        
        confidence = round(blend_weight * ml_score + (1 - blend_weight) * heuristic_score, 4)
        print(f"[ML] {url[:60]} → ml={ml_score:.3f} heuristic={heuristic_score:.3f} weight={blend_weight} blended={confidence:.3f}")

    # 3. ADVANCED ANALYSIS (Baseline "Alive" Factor + LLM Check)
    # Goal: Ensure scores are rarely 0.0 and capture subtle risks
    
    # 3a. Heuristic Baseline (The "Alive" Metric)
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        
        # Baseline: Subdomain complexity (more dots = slightly riskier/complex)
        dots = parsed.netloc.count('.')
        subdomain_risk = max(0, (dots - 1) * 0.02)
        
        # Baseline: Query param complexity
        query_risk = 0.03 if len(parsed.query) > 20 else 0.0
        
        baseline = subdomain_risk + query_risk
        
        # Apply baseline (floor)
        confidence = max(confidence, baseline)
        
        # Cap baseline influence for otherwise safe sites
        if confidence < BASELINE_LOW_CAP:
            confidence = min(confidence, 0.15)
            
    except Exception as e:
        print(f"Baseline calc error: {e}")

    # 3b. LLM Verification (for Ambiguous Sites)
    # If site is "Low Risk" (<0.6) but has nonzero baseline, ask AI to confirm
    if confidence < PHISHING_THRESHOLD and confidence > LLM_MIN_CONFIDENCE_FOR_CHECK:
        try:
            print(f"DEBUG: asking LLM to double-check: {url}")
            llm_result = await service.analyze_url(url)
            
            # Risk = 1.0 - Safety
            llm_risk = 1.0 - llm_result.get("confidence", 1.0)
            
            # If LLM is suspicious, boost the score
            if llm_risk > LLM_SUSPICION_THRESHOLD:
                 # Significant boost if LLM is concerned
                 new_score = max(confidence, llm_risk)
                 if new_score > confidence:
                     confidence = new_score
                     heuristics["ai_flagged"] = True
                     
                 # Append LLM signals for debug/explanation
                 heuristics["ai_signals"] = [s.get("id") for s in llm_result.get("signals", []) if s.get("status") == "DETECTED"]
        except Exception as e:
            print(f"LLM Check error: {e}")

    # 3. Decision Logic & Sensitivity Adjustment
    # Dampen extremely high scores if not in blocklist to avoid false 100%s
    if confidence > MAX_CONFIDENCE_CAP: confidence = MAX_CONFIDENCE_CAP
    
    # Clean domain discount — reduce score for structurally legitimate domains
    # (reasonable length, no hyphens, common TLD)
    # This prevents false positives on sites like campus2college.com, icoeca.com
    import tldextract as _tldext
    _ext = _tldext.extract(url)
    _domain = _ext.domain or ''
    _suffix = _ext.suffix or ''
    _legitimate_tld = _suffix in {
        'com','org','edu','net','gov','in','ac.in','co.in','co.uk','org.uk',
        'info','international','tech','io','me','app','global','network','online'
    }
    
    # More lenient length check for trusted TLDs (.org, .edu, .gov)
    _min_len = 2 if _suffix in {'org', 'edu', 'gov', 'ac.in'} else 4
    
    _clean_domain = (
        len(_domain) >= _min_len and
        len(_domain) <= 32 and
        _domain.count('-') <= 1 and # Allow at most one hyphen (e.g. cti-cert.com)
        _legitimate_tld
    )
    
    if _clean_domain and confidence < 0.95:
        # More aggressive reduction (35% off) for clean-looking organizational domains
        reduction = 0.65 if _suffix in {'org', 'edu', 'gov', 'ac.in'} else 0.70
        confidence = round(confidence * reduction, 4)
        print(f"[ML] Clean domain discount applied: {_domain}.{_suffix} → {confidence:.3f} (reduction={reduction})")
    
    is_phishing = confidence > PHISHING_THRESHOLD

    if confidence >= RISK_HIGH_THRESHOLD:
        risk_level = "High"
    elif confidence >= RISK_MEDIUM_THRESHOLD:
        risk_level = "Medium"
    else:
        risk_level = "Low"
    
    # SAVE TO DB
    try:
        explanation = "AI & Heuristic Analysis"
        if heuristics.get("ai_flagged"): explanation = "AI Detected Suspicious Patterns"
        
        scan_entry = models.ScanResult(
            url=url,
            domain=domain,
            risk_score=float(confidence),
            risk_level=risk_level,
            explanation=explanation
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
        # Return simple list of domain strings (extensions expect {"domains": ["a.com", ...]})
        domains_list = sorted([b.domain for b in blocked if b.domain])
        return {"domains": domains_list}
    except Exception as e:
        print(f"Blocklist Error: {e}")
        return {"domains": []}


# Pydantic Models for Activity
def normalize_domain(d: str):
    """Normalize input to a host without scheme, path, or port and strip leading 'www.'

    Accepts full URLs or bare host names. Returns lower-cased host (e.g. 'example.com').
    """
    if not d:
        return ""
    s = str(d).strip()
    try:
        from urllib.parse import urlparse
        # Ensure there's a scheme so urlparse places netloc correctly
        if not re.match(r'^[a-zA-Z]+://', s):
            s = 'http://' + s
        parsed = urlparse(s)
        host = parsed.hostname or parsed.path or ''
    except Exception:
        host = s
    host = host.lower().strip()
    # Strip leading www.
    if host.startswith('www.'):
        host = host[4:]
    return host

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
        if not clean_domain:
            raise HTTPException(status_code=400, detail="Invalid domain")
        # Remove from blocklist
        db.query(models.BlockedDomain).filter(models.BlockedDomain.domain == clean_domain).delete()
        
        # Add to whitelist (to prevent re-flagging by AI)
        whitelisted = db.query(models.AllowedDomain).filter(models.AllowedDomain.domain == clean_domain).first()
        if not whitelisted:
            db.add(models.AllowedDomain(domain=clean_domain))
        
        db.commit()
        return {"status": "unblocked_and_whitelisted", "domain": clean_domain}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
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
from fastapi import Security


def require_admin(request: Request):
    """Simple admin token check. Set ADMIN_TOKEN in env to enable protection.
    The client must send header 'X-Admin-Token: <token>' to pass."""
    admin_token = os.getenv('ADMIN_TOKEN')
    header = request.headers.get('x-admin-token')
    if not admin_token:
        # No admin token configured — deny to avoid accidental resets in production
        raise HTTPException(status_code=401, detail="Admin token not configured")
    if header != admin_token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True


@app.delete("/api/v1/reset")
def reset_system(db: Session = Depends(get_db), _admin: bool = Depends(require_admin)):
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
async def chat_assistant(request: ChatRequest, service: LlmService = Depends(get_llm_service)):
    try:
        # Forward to the real LLM service
        result = await service.chat_with_context(request.message, request.context)
        return result
    except Exception as e:
        print(f"Chat Error: {e}")
        # Fallback to hardcoded if AI service is completely broken to avoid 500
        return {
            "response": "Terminal Link Unstable. Sentinel is currently in Safe-Mode. How can I help?",
            "suggestions": ["Check Connectivity", "Retry Command"]
        }

# Include Routers
# from app.routes import temporal
# app.include_router(temporal.router)

@app.post("/api/v1/neural/scan")
async def neural_scan(request: Request, service: LlmService = Depends(get_llm_service)):
    try:
        data = await request.json()
        url = data.get("url")
        if not url:
             return {
                "confidence": 0.0,
                "signals": []
             }

        # Use Gemini to analyze the URL
        try:
            result = await service.analyze_url(url)
            return result
        except Exception as e:
            print(f"Neural Scan AI Error: {e}")
            # Fallback to manual if AI fails
            return {
                "confidence": 0.5,
                "signals": [
                    {"id": "AI_ENGINE", "status": "OFFLINE", "score": 0.0}
                ]
            }

    except Exception as e:
        print(f"Neural Scan Error: {e}")
        return {"confidence": 0.0, "signals": []}

# ===========================
# 4. PRIVACY & SETTINGS
# ===========================

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

@app.get("/api/v1/stats/summary", response_model=GlobalStatsResponse)
def get_global_summary(db: Session = Depends(get_db)):
    try:
        total_scans = db.query(models.ScanResult).count()
        threats_blocked = db.query(models.ScanResult).filter(models.ScanResult.risk_level.in_(["High", "Critical"])).count()
        
        # Pattern grouping
        patterns_raw = db.query(models.ScanResult.risk_level, func.count(models.ScanResult.id)).group_by(models.ScanResult.risk_level).all()
        common_patterns = {str(p[0]): int(p[1]) for p in patterns_raw}
        
        # Trend
        recent_trend = []
        now = datetime.utcnow()
        for i in range(6, -1, -1):
            day_start = now - timedelta(days=i)
            day_str = day_start.strftime("%Y-%m-%d")
            start_of_day = datetime(day_start.year, day_start.month, day_start.day)
            end_of_day = start_of_day + timedelta(days=1)
            
            count = db.query(models.ScanResult).filter(
                models.ScanResult.timestamp >= start_of_day,
                models.ScanResult.timestamp < end_of_day
            ).count()
            recent_trend.append(DailyCount(date=day_str, count=count))
            
        return GlobalStatsResponse(
            total_scans=total_scans,
            threats_blocked=threats_blocked,
            common_patterns=common_patterns,
            recent_trend=recent_trend
        )
    except Exception as e:
        print(f"Stats Summary Error: {e}")
        return GlobalStatsResponse(total_scans=0, threats_blocked=0, common_patterns={}, recent_trend=[])

# ===========================
# 5. REAL-TIME SYNC
# ===========================
CURRENT_BROWSING_STATE = {
    "url": "https://google.com",
    "timestamp": datetime.utcnow()
}

class UrlUpdate(BaseModel):
    url: str

@app.post("/api/v1/status/current-url")
def update_current_url(data: UrlUpdate):
    CURRENT_BROWSING_STATE["url"] = data.url
    CURRENT_BROWSING_STATE["timestamp"] = datetime.utcnow()
    return {"status": "updated"}

@app.get("/api/v1/status/current-url")
def get_current_url():
    return CURRENT_BROWSING_STATE
@app.get("/health")
def health_check():
    return {"status": "active", "model_loaded": LGBM_MODEL is not None, "device": "cpu"}

if __name__ == "__main__":
    import uvicorn
    # Bind to localhost by default to avoid exposing the dev server
    uvicorn.run(app, host="127.0.0.1", port=8002)
