# 🏗️ InfraNexus

**InfraNexus** is a full-stack, responsive demonstration platform for predictive infrastructure monitoring and early warning. It presents a governed workspace for portfolio risk, project investigation, explainable analytical signals, scenario analysis, secure source-file staging, benchmarking, and controlled natural-language answers.

### 🔗 Live Demo
**👉 [https://infranexus.onrender.com](https://infranexus.onrender.com/)**

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
| **Intelligence assistant** | Deterministic, read-only query layer grounded exclusively in the structured synthetic portfolio. Unsupported questions return *“Insufficient project data available.”* |
| **Data governance** | CSV/XLS/XLSX source-file staging up to 5 MB, worksheet-aware preview, project-name/sector/agency mapping, secure object storage for source bytes, and relational import metadata/history. |
| **Governed action** | Persisted intervention reviews, immutable response events, saved filters, acceptable-use acknowledgement, and a structured portfolio-brief archive with administrator approval. |
| **Coordinate safety** | An authorised Risk Map that remains marker-free without governed records, plus manual and consent-checked CSV coordinate publication controls restricted to administrators. |

---

## 🏗 Architecture

```text
Synthetic project generator + monthly observations
                 │
       Typed portfolio procedures (tRPC)
                 ├── dashboard / explorer / benchmark queries
                 ├── risk, alert, and explainability rules
                 ├── optional ML-service adapter (1.8 s bounded request)
                 ├── controlled what-if simulation
                 ├── grounded assistant response layer
                 └── secure source-file metadata and storage references
                 │
   React workspace, decision-support views, and documentation
                 │
   Optional local FastAPI service (prediction / explain / simulate / model card)
