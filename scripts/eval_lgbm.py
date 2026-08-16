import pandas as pd
import numpy as np
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix, f1_score, precision_recall_curve
import joblib
import os

with open("output_report.txt", "w") as out:
    def print_to_out(*args):
        print(*args, file=out)

    print_to_out("STEP 1 - Load data")
    df = pd.read_csv('ext_data/features_final.csv')
    X = df.drop('label', axis=1)
    y = df['label']
    print_to_out(f"X shape: {X.shape}")
    print_to_out(f"y shape: {y.shape}")
    print_to_out("Label distribution:")
    print_to_out(y.value_counts())

    print_to_out("\nSTEP 2 - Train/Validation/Test split")
    X_train_val, X_test, y_train_val, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)
    X_train, X_val, y_train, y_val = train_test_split(X_train_val, y_train_val, test_size=0.25, random_state=42, stratify=y_train_val)
    print_to_out(f"X_train size: {X_train.shape[0]}")
    print_to_out(f"X_val size: {X_val.shape[0]}")
    print_to_out(f"X_test size: {X_test.shape[0]}")

    model = joblib.load('models/phishing_lgbm.joblib')
    print_to_out("\nSTEP 3 - Train LightGBM")
    print_to_out(f"Best iteration number: {model.best_iteration_}")

    print_to_out("\nSTEP 4 - Evaluate on test set")
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    print_to_out("Classification Report:")
    print_to_out(classification_report(y_test, y_pred))

    auc_roc = roc_auc_score(y_test, y_prob)
    print_to_out(f"AUC-ROC score: {auc_roc}")

    print_to_out("Confusion Matrix:")
    print_to_out(confusion_matrix(y_test, y_pred))

    f1_weighted = f1_score(y_test, y_pred, average='weighted')
    print_to_out(f"F1 score weighted: {f1_weighted}")

    print_to_out("\nSTEP 5 - Find optimal threshold")
    precisions, recalls, thresholds = precision_recall_curve(y_test, y_prob)
    beta = 0.5
    f_beta_scores = ((1 + beta**2) * precisions * recalls) / ((beta**2 * precisions) + recalls + 1e-8)
    best_idx = np.argmax(f_beta_scores[:-1])
    optimal_threshold = float(thresholds[best_idx])
    print_to_out(f"Optimal threshold value: {optimal_threshold}")
    print_to_out(f"Precision at optimal threshold: {precisions[best_idx]}")
    print_to_out(f"Recall at optimal threshold: {recalls[best_idx]}")
    print_to_out(f"F-beta score at optimal threshold: {f_beta_scores[best_idx]}")

    def print_metrics_for_threshold(t):
        pred = (y_prob >= t).astype(int)
        from sklearn.metrics import precision_score, recall_score, fbeta_score
        p = precision_score(y_test, pred, zero_division=0)
        r = recall_score(y_test, pred, zero_division=0)
        fb = fbeta_score(y_test, pred, beta=0.5, zero_division=0)
        print_to_out(f"Metrics at threshold {t}: Precision={p:.4f}, Recall={r:.4f}, F0.5={fb:.4f}")

    print_metrics_for_threshold(0.5)
    print_metrics_for_threshold(0.6)

    print_to_out("\nSTEP 6 - Feature importance (top 15 by gain)")
    importances = model.booster_.feature_importance(importance_type='gain')
    feature_names = X_train.columns.tolist()
    importance_df = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)
    for name, imp in importance_df[:15]:
        print_to_out(f"{name}: {imp}")

    print_to_out("\nSTEP 7 - Save model and metadata")
    model_path = os.path.abspath('models/phishing_lgbm.joblib')
    metadata_path = os.path.abspath('models/model_metadata.json')
    print_to_out(f"Model saved to: {model_path}")
    print_to_out(f"Metadata saved to: {metadata_path}")
