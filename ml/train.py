"""
RecoverIQ — ML Model Training Pipeline
Trains XGBoost model for P(successful_recovery) and exports serialized artifact.
"""

import json
import os
import joblib
import numpy as np
from datetime import datetime, timezone
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, precision_score, recall_score, f1_score, log_loss
from ml.features import FEATURE_NAMES, extract_feature_vector
from simulator.generate import generate_synthetic_dataset

def train_model():
    print("[ML] Generating synthetic training corpus (10,000 samples)...")
    dataset = generate_synthetic_dataset(num_rows=10000, seed=42)

    X_list = []
    y_list = []

    for row in dataset:
        vec = extract_feature_vector(row, row)
        X_list.append(vec)
        y_list.append(1 if row["successful_recovery"] else 0)

    X = np.array(X_list)
    y = np.array(y_list)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    print(f"[ML] Training XGBoost / Gradient-Boosted Classifier on {len(X_train)} samples...")
    
    # Try importing xgboost, or fallback to sklearn GradientBoostingClassifier
    try:
        import xgboost as xgb
        model = xgb.XGBClassifier(
            n_estimators=120,
            max_depth=4,
            learning_rate=0.08,
            subsample=0.85,
            colsample_bytree=0.85,
            random_state=42,
            eval_metric="logloss"
        )
    except ImportError:
        from sklearn.ensemble import GradientBoostingClassifier
        model = GradientBoostingClassifier(
            n_estimators=120,
            max_depth=4,
            learning_rate=0.08,
            subsample=0.85,
            random_state=42
        )

    model.fit(X_train, y_train)

    y_pred_proba = model.predict_proba(X_test)[:, 1]
    y_pred = (y_pred_proba >= 0.5).astype(int)

    metrics = {
        "auc_roc": float(roc_auc_score(y_test, y_pred_proba)),
        "precision": float(precision_score(y_test, y_pred)),
        "recall": float(recall_score(y_test, y_pred)),
        "f1_score": float(f1_score(y_test, y_pred)),
        "log_loss": float(log_loss(y_test, y_pred_proba)),
    }

    print(f"[ML] Training Complete. Validation AUC-ROC: {metrics['auc_roc']:.4f}, F1: {metrics['f1_score']:.4f}")

    os.makedirs("ml/artifacts", exist_ok=True)
    artifact_path = "ml/artifacts/recovery_xgb_v1.joblib"
    metadata_path = "ml/artifacts/model_metadata.json"

    joblib.dump(model, artifact_path)

    metadata = {
        "model_version": "recovery_xgb_v1.2.0",
        "dataset_version": "rzp_recovery_synthetic_v1_10k",
        "feature_schema_version": "1.0.0",
        "feature_names": FEATURE_NAMES,
        "metrics": metrics,
        "trained_at": datetime.now(timezone.utc).isoformat(),
    }

    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"[ML] Saved model artifact to {artifact_path} and metadata to {metadata_path}.")

if __name__ == "__main__":
    train_model()
