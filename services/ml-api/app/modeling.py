from __future__ import annotations

import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, mean_absolute_error, mean_squared_error, precision_score, r2_score, recall_score, roc_auc_score, roc_curve
from xgboost import XGBClassifier, XGBRegressor


DATASET_LABEL = "Synthetic Demonstration Dataset"
MODEL_VERSION = "paimana-ml-sidecar-v1.1.0"
FEATURE_COLUMNS = [
    "physical_progress",
    "financial_progress",
    "planned_progress",
    "milestones_delayed",
    "extensions",
    "duration_utilization",
    "clearance_score",
    "contractor_score",
    "expenditure_ratio",
    "sector_code",
    "progress_gap",
    "financial_physical_gap",
    "risk_acceleration",
]

SECTOR_CODES = {
    "Roads": 0,
    "Railways": 1,
    "Ports": 2,
    "Airports": 3,
    "Power": 4,
    "Water & Sanitation": 5,
    "Communication": 6,
    "Mining": 7,
    "Steel": 8,
    "Coal": 9,
    "Social Infrastructure": 10,
    "Logistics": 11,
}
CLEARANCE_SCORES = {"Cleared": 0.0, "Conditional": 0.5, "Pending": 1.0}
CONTRACTOR_SCORES = {"Stable": 0.0, "At risk": 0.5, "Under review": 1.0}


def clamp(value: float, lower: float = 0.0, upper: float = 100.0) -> float:
    return float(max(lower, min(upper, value)))


def synthetic_training_data(projects: int = 720, months: int = 12, seed: int = 260824) -> pd.DataFrame:
    """Generate correlated monthly observations for the sidecar training demo.

    The generator is deterministic and intentionally encodes the relationships described in
    the PAIMANA brief. It is not official PAIMANA or OCMS data.
    """
    rng = np.random.default_rng(seed)
    rows: list[dict[str, Any]] = []
    sectors = list(SECTOR_CODES)
    for project_index in range(projects):
        sector = sectors[project_index % len(sectors)]
        duration_months = int(rng.integers(30, 96))
        base_execution = rng.uniform(0.58, 1.06)
        project_scale = rng.uniform(0.65, 1.55)
        clearance_score = float(rng.choice([0.0, 0.5, 1.0], p=[0.66, 0.24, 0.10]))
        contractor_score = float(rng.choice([0.0, 0.5, 1.0], p=[0.64, 0.25, 0.11]))
        extensions = int(rng.integers(0, 4))
        for month_index in range(months):
            duration_utilization = clamp(((month_index + 1) / max(1, duration_months / 12)) * 100)
            planned_progress = clamp((month_index + 1) * (100 / months) * rng.uniform(0.9, 1.08))
            deterioration = max(0.0, (1.0 - base_execution) * 36 + clearance_score * 10 + contractor_score * 9)
            physical_progress = clamp(planned_progress - deterioration - rng.normal(0, 4))
            expenditure_ratio = clamp(physical_progress + rng.normal(8 + project_scale * 7, 10))
            financial_progress = clamp(expenditure_ratio + rng.normal(0, 4))
            milestones_delayed = int(max(0, round(deterioration / 7 + extensions * 0.9 + rng.normal(0, 0.9))))
            progress_gap = max(0.0, planned_progress - physical_progress)
            financial_physical_gap = financial_progress - physical_progress
            risk_acceleration = clamp(progress_gap * 0.45 + milestones_delayed * 3 + clearance_score * 12 + contractor_score * 9 + rng.normal(0, 3), -20, 80)
            cost_overrun = clamp(
                financial_physical_gap * 0.52
                + milestones_delayed * 3.6
                + extensions * 3.4
                + clearance_score * 11
                + project_scale * 4
                + rng.normal(4, 3),
                0,
                75,
            )
            delay_months = clamp(
                progress_gap * 0.2
                + milestones_delayed * 1.6
                + extensions * 2.2
                + contractor_score * 4
                + rng.normal(0.8, 1.1),
                0,
                30,
            )
            implementation_risk = clamp(
                progress_gap * 1.05
                + milestones_delayed * 6
                + clearance_score * 19
                + contractor_score * 16
                + extensions * 4
                + rng.normal(9, 4),
            )
            rows.append(
                {
                    "project_id": f"SYN-{project_index:04d}",
                    "month_index": month_index,
                    "sector": sector,
                    "sector_code": SECTOR_CODES[sector],
                    "physical_progress": physical_progress,
                    "financial_progress": financial_progress,
                    "planned_progress": planned_progress,
                    "milestones_delayed": milestones_delayed,
                    "extensions": extensions,
                    "duration_utilization": duration_utilization,
                    "clearance_score": clearance_score,
                    "contractor_score": contractor_score,
                    "expenditure_ratio": expenditure_ratio,
                    "progress_gap": progress_gap,
                    "financial_physical_gap": financial_physical_gap,
                    "risk_acceleration": risk_acceleration,
                    "cost_overrun_percentage": cost_overrun,
                    "significant_cost_overrun": int(cost_overrun >= 15),
                    "delay_months": delay_months,
                    "delayed": int(delay_months >= 3),
                    "implementation_risk": implementation_risk,
                }
            )
    return pd.DataFrame(rows)


def _classification_metrics(y_true: pd.Series, probabilities: np.ndarray) -> dict[str, float]:
    labels = (probabilities >= 0.5).astype(int)
    return {
        "accuracy": round(float(accuracy_score(y_true, labels)), 3),
        "precision": round(float(precision_score(y_true, labels, zero_division=0)), 3),
        "recall": round(float(recall_score(y_true, labels, zero_division=0)), 3),
        "f1": round(float(f1_score(y_true, labels, zero_division=0)), 3),
        "roc_auc": round(float(roc_auc_score(y_true, probabilities)), 3),
    }


def _regression_metrics(y_true: pd.Series, prediction: np.ndarray) -> dict[str, float]:
    return {
        "mae": round(float(mean_absolute_error(y_true, prediction)), 3),
        "rmse": round(float(np.sqrt(mean_squared_error(y_true, prediction))), 3),
        "r2": round(float(r2_score(y_true, prediction)), 3),
    }


@dataclass
class ModelBundle:
    cost_regressor: RandomForestRegressor
    cost_classifier: RandomForestClassifier
    delay_classifier: RandomForestClassifier
    delay_regressor: RandomForestRegressor
    implementation_regressor: RandomForestRegressor
    xgb_cost_regressor: XGBRegressor
    xgb_delay_classifier: XGBClassifier
    metrics: dict[str, Any]
    feature_means: dict[str, float]
    trained_at: str
    model_version: str = MODEL_VERSION

    def save(self, artifact_path: Path) -> None:
        artifact_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self, artifact_path)

    @classmethod
    def load(cls, artifact_path: Path) -> "ModelBundle":
        return joblib.load(artifact_path)

    def model_card(self) -> dict[str, Any]:
        return {
            "modelVersion": self.model_version,
            "trainedAt": self.trained_at,
            "datasetLabel": DATASET_LABEL,
            "trainingProtocol": "Time-ordered hold-out: months 1–9 train, months 10–12 test.",
            "featureNames": FEATURE_COLUMNS,
            "models": [
                "Linear Regression baseline",
                "Logistic Regression baseline",
                "Random Forest production synthetic estimator",
                "XGBoost challenger",
            ],
            "metrics": self.metrics,
            "limitations": "Synthetic demonstration training only. Outputs are analytical estimates, not official Government of India decisions.",
        }


def train_bundle() -> ModelBundle:
    data = synthetic_training_data()
    train = data[data["month_index"] <= 8]
    test = data[data["month_index"] > 8]
    X_train = train[FEATURE_COLUMNS]
    X_test = test[FEATURE_COLUMNS]
    random_state = 248

    baseline_cost = LinearRegression().fit(X_train, train["cost_overrun_percentage"])
    cost_regressor = RandomForestRegressor(n_estimators=96, min_samples_leaf=3, random_state=random_state, n_jobs=1).fit(X_train, train["cost_overrun_percentage"])
    baseline_delay = LogisticRegression(max_iter=500, random_state=random_state).fit(X_train, train["delayed"])
    delay_classifier = RandomForestClassifier(n_estimators=96, min_samples_leaf=3, random_state=random_state, n_jobs=1, class_weight="balanced").fit(X_train, train["delayed"])
    cost_classifier = RandomForestClassifier(n_estimators=96, min_samples_leaf=3, random_state=random_state, n_jobs=1, class_weight="balanced").fit(X_train, train["significant_cost_overrun"])
    delay_regressor = RandomForestRegressor(n_estimators=96, min_samples_leaf=3, random_state=random_state, n_jobs=1).fit(X_train, train["delay_months"])
    implementation_regressor = RandomForestRegressor(n_estimators=96, min_samples_leaf=3, random_state=random_state, n_jobs=1).fit(X_train, train["implementation_risk"])
    xgb_cost_regressor = XGBRegressor(
        n_estimators=120,
        max_depth=4,
        learning_rate=0.06,
        subsample=0.9,
        colsample_bytree=0.9,
        objective="reg:squarederror",
        random_state=random_state,
        n_jobs=1,
    ).fit(X_train, train["cost_overrun_percentage"])
    xgb_delay_classifier = XGBClassifier(
        n_estimators=120,
        max_depth=4,
        learning_rate=0.06,
        subsample=0.9,
        colsample_bytree=0.9,
        eval_metric="logloss",
        random_state=random_state,
        n_jobs=1,
    ).fit(X_train, train["delayed"])

    metrics = {
        "costOverrunPercentage": {
            "baseline": {"name": "Linear Regression", **_regression_metrics(test["cost_overrun_percentage"], baseline_cost.predict(X_test))},
            "challenger": {"name": "Random Forest Regressor", **_regression_metrics(test["cost_overrun_percentage"], cost_regressor.predict(X_test))},
            "xgboostChallenger": {"name": "XGBoost Regressor", **_regression_metrics(test["cost_overrun_percentage"], xgb_cost_regressor.predict(X_test))},
        },
        "scheduleDelayClassification": {
            "baseline": {"name": "Logistic Regression", **_classification_metrics(test["delayed"], baseline_delay.predict_proba(X_test)[:, 1])},
            "challenger": {"name": "Random Forest Classifier", **_classification_metrics(test["delayed"], delay_classifier.predict_proba(X_test)[:, 1])},
            "xgboostChallenger": {"name": "XGBoost Classifier", **_classification_metrics(test["delayed"], xgb_delay_classifier.predict_proba(X_test)[:, 1])},
        },
        "costOverrunClassification": {
            "challenger": {"name": "Random Forest Classifier", **_classification_metrics(test["significant_cost_overrun"], cost_classifier.predict_proba(X_test)[:, 1])},
        },
    }
    return ModelBundle(
        cost_regressor=cost_regressor,
        cost_classifier=cost_classifier,
        delay_classifier=delay_classifier,
        delay_regressor=delay_regressor,
        implementation_regressor=implementation_regressor,
        xgb_cost_regressor=xgb_cost_regressor,
        xgb_delay_classifier=xgb_delay_classifier,
        metrics=metrics,
        feature_means={column: float(train[column].mean()) for column in FEATURE_COLUMNS},
        trained_at=datetime.now(timezone.utc).isoformat(),
    )


def artifact_path() -> Path:
    return Path(os.getenv("ARTIFACT_DIR", "/tmp/paimana-artifacts")) / "model_bundle.joblib"


def load_or_train() -> ModelBundle:
    path = artifact_path()
    if path.exists():
        loaded = ModelBundle.load(path)
        if loaded.model_version == MODEL_VERSION and hasattr(loaded, "xgb_cost_regressor"):
            return loaded
    bundle = train_bundle()
    bundle.save(path)
    write_artifacts(bundle)
    return bundle


def feature_row(payload: dict[str, Any]) -> pd.DataFrame:
    clearance = payload.get("clearance_status", "Cleared")
    contractor = payload.get("contractor_status", "Stable")
    physical = float(payload["physical_progress"])
    financial = float(payload["financial_progress"])
    planned = float(payload["planned_progress"])
    return pd.DataFrame(
        [
            {
                "physical_progress": physical,
                "financial_progress": financial,
                "planned_progress": planned,
                "milestones_delayed": float(payload["milestones_delayed"]),
                "extensions": float(payload["extensions"]),
                "duration_utilization": float(payload["duration_utilization"]),
                "clearance_score": CLEARANCE_SCORES[clearance],
                "contractor_score": CONTRACTOR_SCORES[contractor],
                "expenditure_ratio": float(payload.get("expenditure_ratio", financial)),
                "sector_code": SECTOR_CODES.get(payload.get("sector", "Roads"), 0),
                "progress_gap": max(0.0, planned - physical),
                "financial_physical_gap": financial - physical,
                "risk_acceleration": float(payload.get("risk_acceleration", 0.0)),
            }
        ],
        columns=FEATURE_COLUMNS,
    )


def prediction(bundle: ModelBundle, payload: dict[str, Any], simulation: bool = False) -> dict[str, Any]:
    row = feature_row(payload)
    cost_overrun = clamp(float(bundle.cost_regressor.predict(row)[0]), 0, 80)
    cost_probability = clamp(float(bundle.cost_classifier.predict_proba(row)[0, 1]) * 100)
    delay_probability = clamp(float(bundle.delay_classifier.predict_proba(row)[0, 1]) * 100)
    delay_months = clamp(float(bundle.delay_regressor.predict(row)[0]), 0, 36)
    implementation_risk = clamp(float(bundle.implementation_regressor.predict(row)[0]))
    cost_risk = clamp(17 + cost_overrun * 1.35)
    time_risk = clamp(16 + delay_months * 4.2)
    overall_risk = clamp(cost_risk * 0.35 + time_risk * 0.35 + implementation_risk * 0.30)
    category = "Critical" if overall_risk > 75 else "High" if overall_risk > 50 else "Moderate" if overall_risk > 25 else "Low"
    approved_cost = payload.get("approved_cost")
    return {
        "costOverrunProbability": round(cost_probability, 1),
        "predictedCostOverrunPercentage": round(cost_overrun, 1),
        "predictedFinalCost": round(float(approved_cost) * (1 + cost_overrun / 100), 2) if approved_cost is not None else None,
        "delayProbability": round(delay_probability, 1),
        "predictedDelayMonths": round(delay_months, 1),
        "costRisk": round(cost_risk, 1),
        "timeRisk": round(time_risk, 1),
        "implementationRisk": round(implementation_risk, 1),
        "overallRisk": round(overall_risk, 1),
        "riskCategory": category,
        "modelVersion": bundle.model_version,
        "datasetLabel": DATASET_LABEL,
        "simulation": simulation,
        "disclaimer": "Analytical output from a synthetic demonstration model; not an official Government of India decision.",
    }


def explanation(bundle: ModelBundle, payload: dict[str, Any]) -> dict[str, Any]:
    row = feature_row(payload)
    feature_values = row.iloc[0].to_dict()
    method = "TreeSHAP"
    try:
        import shap

        explainer = shap.TreeExplainer(bundle.cost_regressor)
        raw_values = np.asarray(explainer.shap_values(row))
        contributions = raw_values.reshape(-1)
        expected = np.asarray(explainer.expected_value).reshape(-1)
        base_value = float(expected[0])
        predicted_output = float(bundle.cost_regressor.predict(row)[0])
        additivity_residual = predicted_output - base_value - float(np.sum(contributions))
    except Exception as error:
        return {
            "method": "TreeSHAP unavailable",
            "explanationAvailable": False,
            "positiveContributors": [],
            "negativeContributors": [],
            "featureValues": [],
            "signedContributions": [],
            "baseValue": None,
            "predictedOutput": round(float(bundle.cost_regressor.predict(row)[0]), 3),
            "additivityResidual": None,
            "modelVersion": bundle.model_version,
            "datasetLabel": DATASET_LABEL,
            "disclaimer": "TreeSHAP could not be calculated for this synthetic model request. No heuristic attribution has been substituted.",
            "error": str(error),
        }
    factors = [
        {
            "feature": column.replace("_", " ").title(),
            "value": round(float(feature_values[column]), 2),
            "contribution": round(float(contributions[index]), 3),
            "direction": "positive" if contributions[index] >= 0 else "negative",
        }
        for index, column in enumerate(FEATURE_COLUMNS)
    ]
    positives = sorted([factor for factor in factors if factor["contribution"] >= 0], key=lambda factor: factor["contribution"], reverse=True)[:5]
    negatives = sorted([factor for factor in factors if factor["contribution"] < 0], key=lambda factor: factor["contribution"])[:5]
    return {
        "method": method,
        "explanationAvailable": True,
        "positiveContributors": positives,
        "negativeContributors": negatives,
        "featureValues": factors,
        "signedContributions": factors,
        "baseValue": round(base_value, 3),
        "predictedOutput": round(predicted_output, 3),
        "additivityResidual": round(additivity_residual, 8),
        "modelVersion": bundle.model_version,
        "datasetLabel": DATASET_LABEL,
        "disclaimer": "Explanation applies to the synthetic demonstration model and is not an official decision rule.",
    }


def model_evidence(bundle: ModelBundle) -> dict[str, Any]:
    """Return reproducible held-out evidence, never operational portfolio claims."""
    data = synthetic_training_data()
    held_out = data[data["month_index"] > 8]
    features = held_out[FEATURE_COLUMNS]
    probabilities = bundle.delay_classifier.predict_proba(features)[:, 1]
    predicted_labels = (probabilities >= 0.5).astype(int)
    false_positive_rate, true_positive_rate, thresholds = roc_curve(held_out["delayed"], probabilities)
    matrix = confusion_matrix(held_out["delayed"], predicted_labels, labels=[0, 1]).tolist()
    importance_order = np.argsort(bundle.cost_regressor.feature_importances_)[::-1]
    return {
        "datasetLabel": DATASET_LABEL,
        "modelVersion": bundle.model_version,
        "trainingProtocol": "Time-ordered hold-out: months 1–9 train, months 10–12 test.",
        "rocCurve": {
            "target": "schedule delay classification",
            "falsePositiveRate": [round(float(value), 5) for value in false_positive_rate],
            "truePositiveRate": [round(float(value), 5) for value in true_positive_rate],
            "thresholds": [round(float(value), 5) for value in thresholds],
            "auc": bundle.metrics["scheduleDelayClassification"]["challenger"]["roc_auc"],
        },
        "confusionMatrix": {
            "target": "schedule delay classification",
            "labels": ["On schedule", "Delayed"],
            "matrix": matrix,
            "threshold": 0.5,
        },
        "featureImportance": [
            {"feature": FEATURE_COLUMNS[index].replace("_", " ").title(), "importance": round(float(bundle.cost_regressor.feature_importances_[index]), 6)}
            for index in importance_order
        ],
        "disclaimer": "Evidence is calculated from the deterministic synthetic hold-out set. It does not measure production or official PAIMANA performance.",
    }


def write_artifacts(bundle: ModelBundle) -> None:
    """Persist reproducible synthetic artifacts for local Compose and evidence review.

    The files are never presented as authorised portfolio data. They document the
    deterministic training run and retain an actual TreeExplainer output sample.
    """
    target = artifact_path().parent
    target.mkdir(parents=True, exist_ok=True)
    (target / "model_card.json").write_text(json.dumps(bundle.model_card(), indent=2), encoding="utf-8")
    training_data = synthetic_training_data()
    training_data.to_csv(target / "synthetic_training_data.csv", index=False)
    (target / "model_evidence.json").write_text(json.dumps(model_evidence(bundle), indent=2), encoding="utf-8")
    sample = training_data.iloc[[0]][FEATURE_COLUMNS]
    try:
        import shap

        explainer = shap.TreeExplainer(bundle.cost_regressor)
        raw_values = np.asarray(explainer.shap_values(sample)).reshape(-1)
        expected = np.asarray(explainer.expected_value).reshape(-1)
        shap_artifact = {
            "method": "TreeSHAP",
            "modelVersion": bundle.model_version,
            "datasetLabel": DATASET_LABEL,
            "baseValue": round(float(expected[0]), 5),
            "predictedOutput": round(float(bundle.cost_regressor.predict(sample)[0]), 5),
            "additivityResidual": round(float(bundle.cost_regressor.predict(sample)[0]) - float(expected[0]) - float(np.sum(raw_values)), 8),
            "projectId": "SYN-0000",
            "featureContributions": [
                {"feature": feature.replace("_", " ").title(), "value": round(float(sample.iloc[0][feature]), 4), "contribution": round(float(raw_values[index]), 5)}
                for index, feature in enumerate(FEATURE_COLUMNS)
            ],
            "disclaimer": "Real TreeExplainer output from the deterministic synthetic random-forest model. It indicates model influence, not causation.",
        }
    except Exception as error:
        shap_artifact = {
            "method": "TreeSHAP unavailable",
            "modelVersion": bundle.model_version,
            "datasetLabel": DATASET_LABEL,
            "error": str(error),
            "disclaimer": "Artifact generation failed locally; do not substitute heuristic feature weights for SHAP.",
        }
    (target / "shap_artifact.json").write_text(json.dumps(shap_artifact, indent=2), encoding="utf-8")


def model_card_json(bundle: ModelBundle) -> str:
    return json.dumps(bundle.model_card(), indent=2)
