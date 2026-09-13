# Synthetic Demonstration Dataset — Data Dictionary

| Entity | Key fields | Purpose |
|---|---|---|
| `projects` | `projectId`, name, ministry, sector, state, approved/revised cost, expenditure, physical/financial progress, project status | Portfolio context and current project state. |
| `monthlyProjectUpdates` | project ID, observation month, physical/financial/planned progress, monthly/cumulative expenditure, delayed milestones, risk level | Time-ordered trajectory observations used for monitoring and leakage-aware model evaluation. |
| `predictions` | cost-overrun probability, expected overrun percentage, delay probability, expected delay, implementation risk, overall score, model version | Stored analytical output contract for an authorised future model service. |
| `importFiles` | original filename, object-storage key/URL, MIME type, file size, row count, validation state, importer, timestamp | Metadata for securely stored source files; no source bytes are kept in the database. |

The embedded portfolio uses **1,248** generated projects and **9,984** monthly observation records. It contains intentionally designed healthy, cost-risk, schedule-risk, and critical scenarios. Values should never be interpreted as live government project information.
