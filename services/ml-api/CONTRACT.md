# PAIMANA AI ML Sidecar Contract

## Purpose

The Python service is an **optional, local Docker Compose sidecar** that adds reproducible model training, prediction, and explainability behind the existing PAIMANA AI interface. The current React workspace, TypeScript procedures, routes, visual treatment, and demonstration fallback remain intact.

> The service only processes the **Synthetic Demonstration Dataset** unless an authorised data connector and production governance workflow are added separately. Its outputs are analytical estimates, not official Government of India decisions.

## Runtime Boundary

| Runtime | ML behaviour |
|---|---|
| Local Docker Compose | The Node application calls `ML_SERVICE_URL` for trained cost, delay, implementation-risk, and explanation outputs. |
| Managed WebDev deployment | The existing controlled demonstration calculations remain available when no ML service URL is configured or the sidecar is unavailable. |
| Future production deployment | A separately hosted FastAPI service may be configured through a server-only URL and authenticated service credentials. |

## Service Endpoints

| Method and path | Purpose | Data-safety rule |
|---|---|---|
| `GET /health` | Readiness and loaded-model status. | Contains no project data. |
| `GET /v1/model-card` | Model version, features, training split, and evaluation metrics. | Clearly marks synthetic-demo provenance. |
| `POST /v1/predict` | Returns cost-overrun probability/percentage, delay probability/months, implementation risk, and overall risk. | Validates a bounded project feature payload. |
| `POST /v1/explain` | Returns positive and negative feature contributions for the prediction. | Uses model-derived attribution; never fabricates feature values. |
| `POST /v1/simulate` | Recalculates prediction outputs from controlled what-if inputs. | Marks every response as a simulation. |
| `POST /v1/train` | Rebuilds models from the deterministic synthetic training dataset. | Local development/demo operation only; does not accept external source files. |

## Model Approach

The service uses a deterministic synthetic training generator with meaningful infrastructure relationships. It performs a **time-ordered split** by project observation month, trains baseline linear/logistic models and tree-based challenger models, chooses a champion based on held-out metrics, and persists the selected artifacts plus model-card metadata.

The initial feature set includes physical and financial progress, planned-progress gap, expenditure ratio, delayed milestones, extensions, duration utilisation, clearance condition, contractor condition, and sector. Feature-attribution responses expose the effective values and direction of contribution; no raw model internals or hidden claims are surfaced as official decisions.

## Node Application Adapter

The TypeScript adapter must use a short server-side timeout, validate the response against a typed schema, and immediately fall back to the existing deterministic demo calculation when the sidecar is absent, unhealthy, or returns an invalid payload. The frontend will continue to use its current typed application procedures and will not call the FastAPI service directly.
