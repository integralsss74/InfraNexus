# PAIMANA AI FastAPI ML Sidecar

This service is the local, Python-based model layer for the PAIMANA AI hybrid architecture. It preserves the current React interface and TypeScript server; the existing app calls it only when `ML_SERVICE_URL` is configured.

## Local Run

Use Docker Compose from the repository root:

```bash
docker compose up --build paimana-ml-service
```

The service is available at `http://localhost:8010`. The first request trains deterministic synthetic-demo models and writes a model artifact under `services/ml-api/artifacts/`.

## Verification

```bash
cd services/ml-api
python -m pytest -q
```

The service provides `/health`, `/v1/model-card`, `/v1/predict`, `/v1/explain`, `/v1/simulate`, and local-development `/v1/train` endpoints.

> All models use a synthetic demonstration dataset. Predictions, explanations, and simulations are analytical outputs and not official Government of India decisions.
