"""Trains the Latchpoint risk model on the synthetic dataset (spec §8.3).

Run once during setup, not at request time.
Run from backend/: python -m app.ml.train_model
"""

import pickle

import pandas as pd
import shap
from sklearn.metrics import roc_auc_score, classification_report
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

from app.ml.feature_spec import FEATURE_COLUMNS

CSV_PATH = "app/ml/synthetic_transactions.csv"
ARTIFACT_PATH = "app/ml/model_artifact.pkl"


def main():
    df = pd.read_csv(CSV_PATH)
    X = df[FEATURE_COLUMNS]
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = XGBClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.1,
        eval_metric="logloss",
        random_state=42,
    )
    model.fit(X_train, y_train)

    probs = model.predict_proba(X_test)[:, 1]
    preds = model.predict(X_test)
    auc = roc_auc_score(y_test, probs)
    print(f"AUC: {auc:.4f}")
    print(classification_report(y_test, preds))

    explainer = shap.TreeExplainer(model)

    with open(ARTIFACT_PATH, "wb") as f:
        pickle.dump(
            {"model": model, "explainer": explainer, "feature_order": FEATURE_COLUMNS},
            f,
        )
    print(f"Saved model artifact to {ARTIFACT_PATH}")


if __name__ == "__main__":
    main()
