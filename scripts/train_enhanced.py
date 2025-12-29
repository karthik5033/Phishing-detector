import pandas as pd
import numpy as np
import joblib
import os
import re
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
    }
]

# Initialize Model (Incremental Multi-Label Learning)
# MultiOutputClassifier fits one classifier per target. 
# SGDClassifier supports partial_fit.
print("🔧 Initializing Enhanced Model (SGD + Hashing)...")

# Feature Hashing (Stateless, Fixed Dimension)
# n_features=2**18 (262k) is usually enough for URL tokens, 2**20 (1M) is safer for big data
vectorizer = HashingVectorizer(
    n_features=2**20, 
    alternate_sign=False, 
    ngram_range=(3, 5), 
    analyzer='char_wb'
)

# Multi-Output SGD
# class_weight={0:1, 1:10} manually sets a 10x penalty for missed phishing sites (Stable fix)
clf = MultiOutputClassifier(
    SGDClassifier(loss='log_loss', penalty='l2', alpha=1e-4, random_state=42, max_iter=1000, tol=1e-3, class_weight={0: 1, 1: 10}),
    n_jobs=1
)

def clean_url(url):
    if not isinstance(url, str):
        return ""
    url = url.lower()
    # Remove common prefixes to focus on the domain and path patterns
    for prefix in ['https://', 'http://', 'www.']:
        if url.startswith(prefix):
            url = url[len(prefix):]
    return url

print(f"🚀 Starting Training on ~1.1 Million Samples...")
start_time = datetime.now()
total_samples = 0
classes = [np.array([0, 1])] * 4 # 4 labels, each binary (0 or 1)

for ds in DATASETS:
    path = ds['path']
    if not os.path.exists(path):
        print(f"⚠️  Skipping {os.path.basename(path)} (Not found)")
        continue
        
    print(f"\n📂 Loading {os.path.basename(path)}...")
    
    # Process in chunks
    chunk_iter = pd.read_csv(path, chunksize=CHUNK_SIZE)
    
    for i, chunk in enumerate(chunk_iter):
        # 1. Prepare X
        # Normalize URL column name
        if ds['url_col'] != 'url':
            chunk = chunk.rename(columns={ds['url_col']: 'url'})
            
        # Clean URLs
        chunk['url'] = chunk['url'].apply(clean_url)
        
        # Vectorize
        X_vec = vectorizer.transform(chunk['url'])
        
        # 2. Prepare Y (4 columns)
        # Handle non-numeric or missing data gracefully
        try:
            # Force numeric, coerce errors to NaN, then fill 0
            Y = chunk[ds['labels']].apply(pd.to_numeric, errors='coerce').fillna(0).astype(int)
        except Exception as e:
            print(f"   ⚠️ Skipping chunk {i+1} due to bad data: {e}")
            continue
        
        # 3. Incremental Train
        clf.partial_fit(X_vec, Y, classes=classes)
        
        total_samples += len(chunk)
        print(f"   ✓ Processed chunk {i+1} ({len(chunk)} rows) - Total: {total_samples}")

print(f"\n✅ Training Complete! Total samples: {total_samples}")
print(f"⏱️  Duration: {datetime.now() - start_time}")

# Save Models
print("💾 Saving models...")
joblib.dump(clf, os.path.join(MODELS_DIR, 'model_enhanced.joblib'))
joblib.dump(vectorizer, os.path.join(MODELS_DIR, 'vectorizer_enhanced.joblib'))
print("🎉 Done! New 'model_enhanced.joblib' is ready.")
