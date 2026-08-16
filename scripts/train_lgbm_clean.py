import pandas as pd
import numpy as np
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix, f1_score, precision_recall_curve
import joblib
import json
import os

print("STEP 1 - Load data")
df = pd.read_csv('ext_data/features_final.csv')
X = df.drop('label', axis=1)
y = df['label']
print(f"X shape: {X.shape}")
print(f"y shape: {y.shape}")
print("Label distribution:")
print(y.value_counts())

print("\nSTEP 2 - Train/Validation/Test split")
# 80% train+val, 20% test
X_train_val, X_test, y_train_val, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)
# Then split 80% into 75% train, 25% val
X_train, X_val, y_train, y_val = train_test_split(X_train_val, y_train_val, test_size=0.25, random_state=42, stratify=y_train_val)
print(f"X_train size: {X_train.shape[0]}")
print(f"X_val size: {X_val.shape[0]}")
print(f"X_test size: {X_test.shape[0]}")

print("\nSTEP 3 - Train LightGBM")
model = lgb.LGBMClassifier(
    n_estimators=1000,
    learning_rate=0.05,
    num_leaves=63,
    max_depth=8,
    min_child_samples=50,
    feature_fraction=0.8,
    bagging_fraction=0.8,
    bagging_freq=5,
    lambda_l1=0.1,
    lambda_l2=0.1,
    class_weight='balanced',
    random_state=42,
    verbose=-1
)

callbacks = [
    lgb.early_stopping(stopping_rounds=50, verbose=False)
]

with open(os.devnull, 'w') as f:
    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        callbacks=callbacks
    )

best_iteration = model.best_iteration_
print(f"\nBest iteration number: {best_iteration}")

print("\nSTEP 4 - Evaluate on test set")
y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]

print("Classification Report:")
print(classification_report(y_test, y_pred))

auc_roc = roc_auc_score(y_test, y_prob)
print(f"AUC-ROC score: {auc_roc}")

print("Confusion Matrix:")
print(confusion_matrix(y_test, y_pred))

f1_weighted = f1_score(y_test, y_pred, average='weighted')
print(f"F1 score weighted: {f1_weighted}")

print("\nSTEP 5 - Find optimal threshold")
precisions, recalls, thresholds = precision_recall_curve(y_test, y_prob)
beta = 0.5
f_beta_scores = ((1 + beta**2) * precisions * recalls) / ((beta**2 * precisions) + recalls + 1e-8)
best_idx = np.argmax(f_beta_scores[:-1]) # ignore last element which doesn't have a matching threshold
optimal_threshold = float(thresholds[best_idx])
print(f"Optimal threshold value: {optimal_threshold}")
print(f"Precision at optimal threshold: {precisions[best_idx]}")
print(f"Recall at optimal threshold: {recalls[best_idx]}")
print(f"F-beta score at optimal threshold: {f_beta_scores[best_idx]}")

def print_metrics_for_threshold(t):
    pred = (y_prob >= t).astype(int)
    from sklearn.metrics import precision_score, recall_score, fbeta_score
    p = precision_score(y_test, pred, zero_division=0)
    r = recall_score(y_test, pred, zero_division=0)
    fb = fbeta_score(y_test, pred, beta=0.5, zero_division=0)
    print(f"Metrics at threshold {t}: Precision={p:.4f}, Recall={r:.4f}, F0.5={fb:.4f}")

print_metrics_for_threshold(0.5)
print_metrics_for_threshold(0.6)

print("\nSTEP 6 - Feature importance (top 15 by gain)")
importances = model.booster_.feature_importance(importance_type='gain')
feature_names = X_train.columns.tolist()
importance_df = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)
for name, imp in importance_df[:15]:
    print(f"{name}: {imp}")

print("\nSTEP 7 - Save model and metadata")
os.makedirs('models', exist_ok=True)
model_path = os.path.abspath('models/phishing_lgbm.joblib')
metadata_path = os.path.abspath('models/model_metadata.json')

# Dump without touching other output
joblib.dump(model, model_path)

metadata = {
  "model_type": "LGBMClassifier",
  "features": feature_names,
  "optimal_threshold": optimal_threshold,
  "training_rows": X_train.shape[0],
  "test_auc": round(auc_roc, 4),
  "test_f1": round(f1_weighted, 4),
  "best_iteration": best_iteration
}

with open(metadata_path, 'w') as f:
    json.dump(metadata, f, indent=2)

print(f"Model saved to: {model_path}")
print(f"Metadata saved to: {metadata_path}")
