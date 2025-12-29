import pandas as pd
import numpy as np
import joblib
import os
import re
from scipy.sparse import hstack, csr_matrix
from sklearn.linear_model import SGDClassifier
from sklearn.multioutput import MultiOutputClassifier
from sklearn.feature_extraction.text import HashingVectorizer
from datetime import datetime

# Config
CHUNK_SIZE = 50000
MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models')
os.makedirs(MODELS_DIR, exist_ok=True)

# Datasets
DATASETS = [
    {
        "path": os.path.join(os.path.dirname(os.path.dirname(__file__)), "ext_data", "sixLakh.csv"),
        "url_col": "url",
        "labels": ["urgency", "authority", "fear", "impersonation"]
    },
    {
        "path": os.path.join(os.path.dirname(os.path.dirname(__file__)), "ext_data", "fiveLakh.csv"),
        "url_col": "url",
        "labels": ["urgency", "authority", "fear", "impersonation"]
    },
    {
        "path": os.path.join(os.path.dirname(os.path.dirname(__file__)), "ext_data", "gemini-dataset-made.csv"),
        "url_col": "text", # Renaming text -> url
        "labels": ["urgency", "authority", "fear", "impersonation"]
    },
    {
        "path": os.path.join(os.path.dirname(os.path.dirname(__file__)), "ext_data", "hard_negatives.csv"),
        "url_col": "url",
        "labels": ["urgency", "authority", "fear", "impersonation"]
    }
]

# Feature Engineering
def extract_manual_features(urls):
    """
    Extracts dense features from a list of URLs.
    Returns a sparse matrix (csr_matrix) of shape (n_samples, n_features).
    """
    features = []
    
    # Regex for IP address
    ip_pattern = re.compile(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b')
    
    for url in urls:
        if not isinstance(url, str):
            url = ""
            
        row = []
        
        # 1. Has IP Address (Phishing sites often use raw IPs)
        row.append(1 if ip_pattern.search(url) else 0)
        
        # 2. Length Features (Long URLs are suspicious)
        row.append(1 if len(url) > 50 else 0)
        row.append(1 if len(url) > 75 else 0)
        
        # 3. Suspicious Characters
        row.append(url.count('.'))   # Dot count (subdomain chaining)
        row.append(url.count('@'))   # @ symbol (obfuscation)
        row.append(url.count('-'))   # Hyphens (often used in fake domains)
        
        # 4. Sensitive Keywords (Explicit count)
        lower_url = url.lower()
        for word in ['login', 'signin', 'account', 'update', 'verify', 'secure', 'bank', 'confirm']:
            row.append(1 if word in lower_url else 0)
            
        features.append(row)
        
    return csr_matrix(features)

# Initialize Model (Incremental Multi-Label Learning)
print("🔧 Initializing Enhanced Model v3 (SGD + Hashing + Manual Features)...")

# Feature Hashing
vectorizer = HashingVectorizer(
    n_features=2**20, 
    alternate_sign=False, 
    ngram_range=(3, 5), 
    analyzer='char_wb'
)

# Multi-Output SGD
# Removed manual weights: Smart Features (IP, Keywords) provide enough signal natureally.
clf = MultiOutputClassifier(
    SGDClassifier(loss='log_loss', penalty='l2', alpha=1e-4, random_state=42, max_iter=1000, tol=1e-3),
    n_jobs=1
)

def clean_url(url):
    if not isinstance(url, str):
        return ""
    url = url.lower()
    for prefix in ['https://', 'http://', 'www.']:
        if url.startswith(prefix):
            url = url[len(prefix):]
    return url

print(f"🚀 Starting Training on ~1.1 Million Samples...")
start_time = datetime.now()
total_samples = 0
classes = [np.array([0, 1])] * 4 

for ds in DATASETS:
    path = ds['path']
    if not os.path.exists(path):
        print(f"⚠️  Skipping {os.path.basename(path)} (Not found)")
        continue
        
    print(f"\n📂 Loading {os.path.basename(path)}...")
    
    chunk_iter = pd.read_csv(path, chunksize=CHUNK_SIZE)
    
    for i, chunk in enumerate(chunk_iter):
        # 1. Prepare X
        if ds['url_col'] != 'url':
            chunk = chunk.rename(columns={ds['url_col']: 'url'})
            
        chunk['url'] = chunk['url'].apply(clean_url)
        
        # Feature Extraction
        X_vec = vectorizer.transform(chunk['url'])       # Hashing Features (Sparse)
        X_manual = extract_manual_features(chunk['url']) # Manual Features (Sparse)
        
        # Combine Features
        X_combined = hstack([X_vec, X_manual])
        
        # 2. Prepare Y
        try:
            Y = chunk[ds['labels']].apply(pd.to_numeric, errors='coerce').fillna(0).astype(int)
        except Exception as e:
            print(f"   ⚠️ Skipping chunk {i+1} due to bad data: {e}")
            continue
        
        # 3. Incremental Train
        clf.partial_fit(X_combined, Y, classes=classes)
        
        total_samples += len(chunk)
        print(f"   ✓ Processed chunk {i+1} ({len(chunk)} rows) - Total: {total_samples}")

print(f"\n✅ Training Complete! Total samples: {total_samples}")
print(f"⏱️  Duration: {datetime.now() - start_time}")

# Save Models
print("💾 Saving models...")
joblib.dump(clf, os.path.join(MODELS_DIR, 'model_enhanced.joblib'))
joblib.dump(vectorizer, os.path.join(MODELS_DIR, 'vectorizer_enhanced.joblib'))
print("🎉 Done! New 'model_enhanced.joblib' is ready.")

