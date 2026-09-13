# PAIMANA Production Operations Boundary

PAIMANA remains usable as a managed React, Express, tRPC, and MySQL-compatible synthetic demonstration. The optional local production stack adds FastAPI, PostgreSQL/PostGIS, real synthetic-model artifacts, and signed gateway assertions without replacing the managed authentication boundary.

## Local Compose stack

Use a Docker-capable local host. The managed deployment does not run the Python/PostGIS stack; it continues to use its controlled TypeScript fallback when `ML_SERVICE_URL` is unavailable.

Copy `docker/local-compose.template` into the environment mechanism used by Docker Compose and replace both local placeholders. The gateway secret must be at least 32 characters and must remain server-only.

```bash
docker compose up --build
```

The default local services are shown below.

| Service | Role | Local endpoint |
|---|---|---|
| `web` | Browser-facing Node/Express/tRPC boundary | `http://localhost:3000` |
| `ml-api` | FastAPI ML and protected production repository contract | `http://localhost:8010` |
| `postgres` | PostgreSQL/PostGIS persistence | `localhost:5432` |
| `ollama` | Optional OpenAI-compatible self-hosted LLM provider | `http://localhost:11434` |

Start the optional Ollama service only when it is deliberately configured:

```bash
docker compose --profile ollama up --build
```

## Gateway security

The browser never sends protected FastAPI writes directly. OAuth is validated by Node/tRPC, which creates a short-lived signed assertion carrying only user ID, provider subject, role, issued time, and expiry. FastAPI verifies the signature and rejects missing, invalid, expired, overlong, or malformed claims. FastAPI write routes record actor-attributed production events when the PostGIS repository is configured.

The applicable HTTP header is `X-PAIMANA-Assertion`. It must only be emitted by server-side gateway code. Do not expose `PAIMANA_PRODUCTION_GATEWAY_SECRET` in a `VITE_` variable, client bundle, source-map, or browser request.

## Reproducible synthetic ML artifacts

The deterministic synthetic pipeline trains logistic and linear baselines, random-forest production estimators, and XGBoost challengers using a time-ordered split. It persists the generated synthetic training CSV, model card, joblib bundle, held-out ROC curve, confusion matrix, Random Forest feature-importance ranking, and a real `shap.TreeExplainer` attribution sample. The same evidence contract is available through `GET /v1/model-evidence` whenever the optional sidecar is running.

```bash
PYTHONPATH=services/ml-api python3 analysis/build_synthetic_artifacts.py
PYTHONPATH=services/ml-api pytest -q analysis/tests services/ml-api/tests
```

Artifacts remain explicitly synthetic. TreeSHAP values describe model influence on the synthetic estimate; they do not establish causation or an official determination.

## PostGIS schema and governed coordinates

`services/postgres/init/001_paimana_schema.sql` creates the `paimana` namespace for projects, monthly updates, predictions, alerts, SHAP attributions, import archives, intervention cases/events, and authorised coordinates. Coordinates use `GEOGRAPHY(POINT, 4326)` with a spatial index.

The repository accepts a coordinate only when it references a registered project and an administrator supplies source name, authority reference, precision, and affirmative consent. A new published coordinate supersedes the prior active coordinate rather than deleting evidence history. Without configured authorised coordinates, the browser map remains a deliberate no-coordinate review state.

The managed administration workspace additionally validates maximum-100-row coordinate CSV batches before publication. Required headers are `project_id`, `latitude`, `longitude`, `precision`, `source_name`, `authority_reference`, and `consent_confirmed`; every row must carry an affirmative consent value. CSV parsing only prepares an auditable metadata batch—the server still enforces the authenticated administrator role and governed-use acknowledgement before records are published.

## Grounded brief archive

The managed `portfolioBriefs` table stores a structured review body plus its immutable registered-evidence vector: project identifier, synthetic risk posture, warning identifiers, contributor features, model version, and explanation method. Brief creation is a protected governed-write operation and records an audit event. Approval is restricted to administrators and records a separate audit event; it remains a human governance state rather than an official determination.

## Validation commands

```bash
PYTHONPATH=services/ml-api pytest -q analysis/tests services/ml-api/tests
pnpm test
pnpm check
pnpm build
git diff --check
```

Docker is intentionally not required by the managed development preview. Validate `docker compose config` and run the stack on a Docker-capable local or persistent host before treating FastAPI/PostGIS routes as available.

> **Sandbox validation note.** The current sandbox passes the TypeScript, Vitest, FastAPI, repository, and synthetic-artifact suites. Its Vite production bundle currently exceeds the available JavaScript heap even after practical bundle optimisations, and Docker is not installed. These are documented environment limitations, not successful production-build or Compose smoke-test results.
