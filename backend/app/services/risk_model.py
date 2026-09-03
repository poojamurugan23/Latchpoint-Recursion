"""Loads the trained model artifact once at startup and scores feature
vectors at request time (spec §8.4)."""

import os
import pickle

_ARTIFACT_PATH = os.path.join(os.path.dirname(__file__), "..", "ml", "model_artifact.pkl")

_model = None
_explainer = None
_feature_order: list[str] = []


def load_model():
    global _model, _explainer, _feature_order
    with open(_ARTIFACT_PATH, "rb") as f:
        artifact = pickle.load(f)
    _model = artifact["model"]
    _explainer = artifact["explainer"]
    _feature_order = artifact["feature_order"]


def score(features: dict) -> tuple[float, dict]:
    """Returns (risk_score, {feature_name: shap_value})."""
    if _model is None:
        load_model()

    ordered = [features[name] for name in _feature_order]
    risk_score = float(_model.predict_proba([ordered])[0][1])

    shap_values = _explainer.shap_values([ordered])
    row = shap_values[0]
    shap_by_feature = dict(zip(_feature_order, row))

    return risk_score, shap_by_feature
