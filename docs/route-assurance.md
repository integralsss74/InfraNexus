# PAIMANA Operational Route Assurance

The following table records the authoritative browser routes, their active functional workspace, decision-hierarchy stage, and the safety state expected when data, authority, or optional services are unavailable. The managed application remains a **Synthetic Demonstration Dataset** until a governed source is connected.

| Authoritative route | Functional workspace | Decision stage | Required state behaviour |
|---|---|---|---|
| `/portfolio` | Portfolio command centre | Portfolio | Portfolio metrics show a synthetic-data notice and query loading states without presenting figures as official records. |
| `/register` | Project Explorer | Project | Search, review-zone, empty result, and filtered-export states remain available; two clicks define a native rectangular review zone. |
| `/intelligence` | Portfolio Brief Archive | Action | Signed-out access state, empty archive, generation pending/error, evidence-bounded archived content, and administrator approval state. |
| `/risk-map` | Authorised Risk Map | Evidence | The map base may load, but it shows a deliberate no-coordinate state until active governed coordinate records exist. |
| `/warnings` | Alert Center | Warning | Filtered queue, no-result/export boundary, controlled acknowledgement, and project drill-through. |
| `/reviews` | Intervention Reviews | Review | Signed-out state, acceptable-use gate, role-gated creation/transitions, empty board/dossier, saved-filter, response, and event states. |
| `/signals` | Context Signals | Risk | Loading, unavailable retry, empty register, grouped synthetic context signals, and project/review/simulator continuations. |
| `/evidence` | Model Evidence Artifacts | Explanation | Held-out FastAPI evidence when available; otherwise an explicit withheld-evidence state with no fabricated ROC, confusion matrix, or feature importance. |
| `/import` | Governed Data Management | Project | File-size and mapping validation, Excel worksheet selection, staging history, and secure source-byte boundary. |
| `/quality` | Data Quality | Portfolio | Synthetic quality context, visible score placeholders while loading, and the managed-data limitation notice. |
| `/documentation` | Protected Method Documentation | Review | Sign-in is required before the operational guide renders; authenticated users remain subject to the persisted acceptable-use gate and see synthetic-data and human-review boundaries throughout. |
| `/workflow-settings` | Local Workflow Setup | Action | Browser-local persona creation and selection with explicit simulation-only labels; it cannot alter database-backed account roles or server access. |
| `/account` | Profile and preferences | Action | Signed-in profile, authentication metadata, notification preferences, audit access, and secure logout. |
| `/admin` | Authorised Coordinate Governance | Action | Signed-out and access-denied states, manual and CSV intake validation, consent enforcement, register loading/error/empty states. |

The persistent decision ribbon connects **Portfolio → Risk → Project → Explanation → Warning → Review → Action**. Benchmarking, authorised-map, model-evidence, and presentation flows carry additional continuation affordances so the hierarchy is not merely a navigation label.

## Validation Evidence Matrix

| Route | Browser verification | State/access evidence | Evidence source |
|---|---|---|---|
| `/portfolio` | Healthy command centre shown | Explicit loading, retry, and no-profile rendering paths | Component review; 25 Aug desktop sweep |
| `/register` | Healthy explorer and native review-zone guidance shown | Explicit loading, retry, and no-register paths | Component review; 25 Aug desktop sweep |
| `/intelligence` | Archive empty state shown | Signed-in, archive-empty, mutation-pending/error, and admin-approval controls | Component review; `userWorkspace.test.ts` brief contracts |
| `/risk-map` | No-authorised-coordinate overlay shown | Explicit coordinate-register loading and retry states; no marker fallback | Component review; 25 Aug desktop sweep |
| `/warnings` | Healthy warning queue shown | Explicit loading, retry, and no-register paths | Component review; 25 Aug desktop sweep |
| `/reviews` | Empty board and dossier shown | Signed-out, acceptable-use, role-gated, saved-filter, response, and event states | Component review; `userWorkspace.test.ts` workflow contracts |
| `/signals` | Grouped signal register shown | Loading, retryable unavailable, and no-signal states | Component review; 25 Aug desktop sweep |
| `/evidence` | Intentional withheld-artifact state shown | Loading, no-sidecar, and distinct request-error paths | Component review; 25 Aug desktop sweep |
| `/import` | Controlled empty ingestion form shown | Type/size/worksheet/mapping validation and empty history | Component review; `portfolio.test.ts` import validation |
| `/quality` | Healthy validation profile shown | Explicit loading, retry, and no-profile paths | Component review; 25 Aug desktop sweep |
| `/documentation` | Protected documentation workspace shown | Sign-in-required branch, global acceptable-use gate, persistent synthetic-data and human-review limits | Component review; 25 Aug desktop sweep |
| `/workflow-settings` | Local persona setup shown | Local-only storage, active rail selector, no account-role capability, and review-board simulation context | Component review; `workingPersonas.test.ts`; 25 Aug desktop sweep |
| `/account` | Authenticated profile and sign-out shown | Signed-out profile state, persisted preferences, audit controls | Component review; auth and user-workspace tests |
| `/admin` | Manual/CSV control surface shown | Signed-out, access-denied, CSV validation, loading/retry/empty register states | Component review; `userWorkspace.test.ts` coordinate contracts |
| `/presentation` | Guided Portfolio → Risk continuation shown | Data-loading state plus route-specific continuations for each step | Component review; 25 Aug desktop sweep |

The sandbox browser retained a signed-in administrative session for the route sweep. Therefore, account and administration denied states are verified through their component branches and protected-procedure tests rather than by destructively signing out the active validation session.

## Shared Accessibility Controls

All authenticated command-desk routes now expose a keyboard-visible **Skip to workspace content** link targeting the focusable `workspace-content` main landmark. The persistent rail, route-aware decision ribbon, command palette, dialogs, alert regions, and retry controls retain labelled keyboard targets. Motion remains reduced-motion aware through the civic workspace stylesheet.
