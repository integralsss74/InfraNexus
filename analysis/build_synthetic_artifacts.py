"""Build the deterministic PAIMANA synthetic ML evidence bundle.

Run from the repository root:
  PYTHONPATH=services/ml-api python3 analysis/build_synthetic_artifacts.py

The generated dataset, model card, joblib bundle and TreeExplainer attribution
sample are synthetic demonstration artifacts only.
"""
from __future__ import annotations

import os
from pathlib import Path

from app.modeling import artifact_path, train_bundle, write_artifacts


def main() -> None:
    repository_root = Path(__file__).resolve().parents[1]
    target = Path(os.getenv("ARTIFACT_DIR", repository_root / "services" / "ml-api" / "artifacts"))
    os.environ["ARTIFACT_DIR"] = str(target)
    bundle = train_bundle()
    bundle.save(artifact_path())
    write_artifacts(bundle)
    print(f"Synthetic PAIMANA artifacts written to {target}")


if __name__ == "__main__":
    main()
