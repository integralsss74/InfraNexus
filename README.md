# 🏗️ InfraNexus

**InfraNexus** is a full-stack, responsive demonstration platform for predictive infrastructure monitoring and early warning. It presents a governed workspace for portfolio risk, project investigation, explainable analytical signals, scenario analysis, secure source-file staging, benchmarking, and controlled natural-language answers.

### 🔗 Live Demo
**👉 [https://infranexus.onrender.com](https://infranexus.onrender.com)**

> **Demonstration notice.** The platform uses a **Synthetic Demonstration Dataset** unless it is connected to an authorized source. Predictions, recommendations, benchmark comparisons, and reference outputs are analytical demonstrations; they are not official Government of India decisions or live records.

---

## 🌟 What is included

| Area | Included capability |
|---|---|
| **Portfolio** | 1,248 deterministic synthetic infrastructure projects and 9,984 monthly observations across sectors, ministries, states, agencies, risk categories, predictions, and early-warning signals. |
| **Monitoring** | Dashboard KPIs, reference-figure labelling, risk distribution, sector/ministry comparison, cost and time-overrun distributions, geographic representation, and early-warning feed. |
| **Investigation** | Searchable Project Explorer with filters, sorting, pagination, project detail, financial and schedule summaries, trajectory, risk contributors, alerts, and recommendations. |
| **Decision support** | Transparent cost, schedule, implementation, and overall-risk calculation; configurable-style early-warning thresholds; controlled what-if scenario simulation; benchmarking. |
| **Hybrid ML service** | Optional FastAPI sidecar with deterministic training, time-ordered evaluation, governed prediction/explanation/simulation endpoints, model cards, and a controlled TypeScript fallback. |
| **Explainability** | Real Random Forest TreeSHAP accounting—including base value, model output, signed contributions, and residual—when the sidecar is available. The managed fallback is explicitly labelled non-SHAP. |
| **Intelligence assistant** | Deterministic, read-only query layer grounded exclusively in the structured synthetic portfolio. Unsupported questions return *"Insufficient project data available."* |
| **Data governance** | CSV/XLS/XLSX source-file staging up to 5 MB, worksheet-aware preview, project-name/sector/agency mapping, secure object storage for source bytes, and relational import metadata/history. |
| **Governed action** | Persisted intervention reviews, immutable response events, saved filters, acceptable-use acknowledgement, and a structured portfolio-brief archive with administrator approval. |
| **Coordinate safety** | An authorised Risk Map that remains marker-free without governed records, plus manual and consent-checked CSV coordinate publication controls restricted to administrators. |

---

## 🏗 Architecture


<p align="center">
  <img src="https://raw.githubusercontent.com/integralsss74/paimana-AI/main/InfraNexus_architecture.png"
       alt="InfraNexus System Architecture"
       width="1500">
</p>


## 💻 Local development

The project uses the generated full-stack workspace configuration. Platform-injected variables provide database, OAuth, storage, and service credentials in the managed environment. Do not commit a `.env` file containing real values.

```bash
pnpm install
pnpm dev
```

Run validation with:

```bash
pnpm test
pnpm check
```

---

## 🧠 Optional local FastAPI ML sidecar

The existing workspace remains usable without Python. When `ML_SERVICE_URL` is absent or the sidecar does not respond within 1.8 seconds, the server deliberately returns its deterministic `typescript-demo-fallback` calculation and explanation so that existing dashboard, project, and simulation flows remain available.

For local hybrid development, start the complete optional production-oriented stack on a Docker-capable host:

```bash
docker compose up --build
```

Then start the Node workspace with the sidecar URL available to the server process only:

```bash
ML_SERVICE_URL=http://localhost:8010 pnpm dev
```

The FastAPI service exposes `/health`, `/auth/verify`, `/v1/model-card`, `/v1/model-evidence`, `/v1/predict`, `/v1/explain`, `/v1/simulate`, and optional PostGIS-backed production contracts. The Compose stack contains the Node gateway, FastAPI service, PostgreSQL/PostGIS, and an opt-in Ollama profile. The managed Node deployment retains its safe fallback path when this stack is unavailable.

Run the synthetic model and sidecar checks with:

```bash
PYTHONPATH=services/ml-api pytest -q analysis/tests services/ml-api/tests
```

**Managed hosting boundary.** The managed deployment runs the TypeScript application and retains the fallback path. The Docker Compose sidecar is intended for local Docker development or a separately operated Python-capable environment; it is not embedded into the managed Node runtime.

See production operations for the signed-gateway boundary, local configuration template, PostGIS schema, Docker service roles, coordinate publication controls, and reproducible SHAP artifact workflow.

---

## 🗄️ Database and storage model

The schema includes `projects`, `monthlyProjectUpdates`, `predictions`, and `importFiles`. The active demo portfolio is deterministic in-process synthetic data so that the workspace is usable immediately; the relational schema is ready to preserve authorised future imports and model outputs.

`importFiles` contains only metadata: the original filename, storage key, secured storage URL, MIME type, size, detected rows, validation state, importer, and timestamp. Uploaded source bytes are stored using the object-storage helper rather than in the database.

---

## ⚙️ Procedure surfaces

| Procedure group | Operations |
|---|---|
| `portfolio.overview` | Portfolio KPIs, risk distributions, comparisons, trends, map points, and explicitly labelled April 2026 reference figures. |
| `portfolio.projects` | Controlled project search, filters, pagination, project details, trajectory, alerts, contributors, and model prediction/explanation provenance. |
| `portfolio.alerts` | Rule-generated warning queue, filtering, and analytical acknowledgement. |
| `portfolio.simulate` | Input-validated cost, time, implementation, and overall-risk scenario calculation using the optional model service or fallback. |
| `portfolio.prediction` | Governed hybrid-model outputs with source and version fields. |
| `portfolio.benchmark` | Ministry, sector, state, and agency comparisons. |
| `portfolio.ask` | Grounded, controlled natural-language answers backed only by synthetic records. |
| `portfolio.importPreview` | 5 MB CSV/XLS/XLSX preview, explicit worksheet selection, project-name/sector/agency mapping, secure source-file storage, and metadata recording. |
| `briefs.generate` | Evidence-bounded project brief creation, private archive listing, and administrator approval with audit entries. |
| `userWorkspace.publish` | Administrator-only source-authorised coordinate publication from a manual form or a CSV batch; requires source, authority, precision, and consent. |

---

## 📈 Analytical methodology

The demonstration risk score applies a transparent weighting: 35% cost exposure, 35% schedule exposure, and 30% implementation conditions. It derives explanatory signals from the financial–physical progress gap, planned-versus-actual progress gap, delayed milestones, extensions, clearance state, and contractor condition. Early warnings identify progress slippage, expenditure/progress imbalance, repeated milestone delays, rapid risk deterioration, and projected cost escalation.

The FastAPI sidecar trains deterministic synthetic baselines, Random Forest estimators, and XGBoost challengers using a time-ordered split (months 1–9 train; months 10–12 test). It returns model version, source, dataset label, and a governance disclaimer with every analytical response. Where TreeSHAP executes, it returns the real expected value, predicted output, signed attribution vector, and additivity residual. If TreeSHAP cannot execute, it returns an explicit unavailable state and does not substitute heuristic attributions. These values remain synthetic demonstrations rather than claims about official project performance.

---

