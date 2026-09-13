import json
from pathlib import Path

from app.modeling import train_bundle, write_artifacts


def test_deterministic_training_writes_real_tree_shap_artifacts(monkeypatch, tmp_path: Path):
    monkeypatch.setenv("ARTIFACT_DIR", str(tmp_path))
    bundle = train_bundle()
    write_artifacts(bundle)
    assert (tmp_path / "model_card.json").exists()
    assert (tmp_path / "model_evidence.json").exists()
    assert (tmp_path / "synthetic_training_data.csv").exists()
    shap_artifact = json.loads((tmp_path / "shap_artifact.json").read_text(encoding="utf-8"))
    assert shap_artifact["method"] == "TreeSHAP"
    assert isinstance(shap_artifact["baseValue"], float)
    assert isinstance(shap_artifact["predictedOutput"], float)
    assert abs(shap_artifact["additivityResidual"]) < 0.001
    evidence = json.loads((tmp_path / "model_evidence.json").read_text(encoding="utf-8"))
    assert evidence["rocCurve"]["auc"] > 0.5
    assert len(evidence["confusionMatrix"]["matrix"]) == 2
    assert evidence["featureImportance"]
    assert bundle.model_version.endswith("v1.1.0")
