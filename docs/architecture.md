# PAIMANA AI — Demonstration Architecture

PAIMANA AI is a **synthetic-data demonstration** that separates portfolio data, risk computation, early-warning rules, explainability, and decision-support presentation. The server exposes a controlled typed procedure layer that only queries the generated portfolio and applies deterministic analytical logic. The assistant therefore answers only supported project, risk, progress, and comparison questions and returns an insufficient-data response for anything outside the portfolio.

```text
Synthetic demonstration dataset → validation profile → typed portfolio service
                                                    ├─ risk prediction & scenario engine
                                                    ├─ early-warning rules
                                                    ├─ explainability / driver analysis
                                                    └─ dashboard, explorer, assistant, and data-management views
```

Uploaded CSV and Excel source files are stored through the secure object-storage layer. The relational schema stores only metadata such as the storage key, MIME type, validation result, row count, and import status; it does not store source file bytes.
