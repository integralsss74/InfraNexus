# Validation Notes

## 25 August 2026 — Civic Workspace Visual Pass

The restarted development service rendered the light civic landing page without the prior stale-module failure. The authenticated workspace rendered the dark institutional rail, the persisted governed-use acknowledgement gate, the safe no-coordinate Risk Map state, and the protected administration route without layout failure at a 1280 × 720 viewport.

The Risk Map correctly retained its base geography while displaying a clear no-authorised-coordinate safeguard. The Evidence alias required a route correction after the initial verification because the shell-level alias redirected it to the older Model Performance page; it now resolves directly to the dedicated model-evidence artifact workspace.

The acknowledgement gate intentionally obscures operational content until consent is recorded. A future signed-in verification should acknowledge the policy and exercise the post-gate artefact, coordinate-publication, and map-marker paths against an authorised test record.

## 25 August 2026 — Production Bundle Constraint

The full TypeScript check, managed Vitest suite, FastAPI endpoint and repository tests, and reproducible synthetic artifact tests pass. Production bundling was attempted after removing the Leaflet Draw UMD wrapper, enabling CommonJS handling, reducing output reporting, targeting ES2022, and disabling debug-only JSX source-location instrumentation during production builds; Vite still exhausts the sandbox’s approximately 1 GB JavaScript heap before completing. This is recorded as an unresolved environment/build-budget constraint rather than a successful production-build verification. Docker is also unavailable in this sandbox, so the Compose smoke test remains a required Docker-capable-host validation step.

The final production optimisation pass additionally route-loaded the independent governance, import, administration, brief, and account workspaces; dynamically loaded jsPDF only when a PDF export is requested; and explicitly disabled sourcemaps. Type checking and all managed tests remained successful after the split. Vite nevertheless reached the same bounded 1 GB heap ceiling during production graph processing. Further build retries are intentionally deferred; the remaining durable remediation is deeper extraction of the map/chart-heavy Workspace module or a larger build host.

The Leaflet project filters, authorised-coordinate map, dashboard map, and presentation map were subsequently extracted into a dedicated lazy `MapViews` module, retaining native two-click review zones, clustering, and coordinate safeguards. Type checking and all 36 managed tests passed after the extraction. The 1 GB sandbox production build still exhausted its heap while Vite processed the remaining map/chart-heavy graph, confirming that host memory or a larger future module decomposition is required rather than further retries in this environment.

Browser verification after the map split confirmed that `/register` loads the Project Explorer with interactive Leaflet state markers and native two-click review-zone instructions, while `/risk-map` loads the authorised-coordinate layer and its deliberate no-authorised-coordinate safeguard. The lazy map chunk preserves both required user-facing paths.

## 25 August 2026 — Operational Route Assurance Pass

The named Signals route now renders a dedicated Context Signals register with explicit synthetic-data boundaries, grouped operational signals, project drill-through, and direct review/simulator actions. The Workflow Settings alias reaches the functional Intervention Reviews workspace, including its status-board empty state, case-dossier empty state, and persisted-filter control. Both routes were verified at a 1280 × 720 viewport with readable dark-rail navigation and no visual overlap.

## 25 August 2026 — Mobile Workflow Pass

The Portfolio Brief Archive and Authorised Coordinate Governance screens were verified at 375 × 812. The brief archive keeps its generation control, empty archive state, and evidence-boundary disclosure legible in a single-column flow. The administration surface preserves all manual consent fields, exposes the required CSV headers and intake trigger, and retains an explicit no-authorised-coordinates empty state without horizontal clipping.

## 25 August 2026 — Decision Hierarchy Pass

The civic workspace now renders an accessible, route-aware Portfolio → Risk → Project → Explanation → Warning → Review → Action ribbon above operational pages. Desktop screenshots confirmed the active Portfolio and Review states align with Dashboard and Intervention Reviews. At 375 × 812 the ribbon keeps its compact tab treatment and horizontal overflow affordance rather than compressing its labels; the dashboard remains readable below it.

## 25 August 2026 — Targeted Hierarchy Route Pass

Benchmarking now presents a Comparison → Risk continuation to Context Signals, the authorised Risk Map presents a Spatial Review → Evidence continuation to the review workflow, and the Model Evidence route presents an Explanation → Warning continuation. The cinematic Presentation route now carries the same decision ribbon while retaining its full demonstration canvas and active Action state. These routes were visually verified at 1280 × 720; the Risk Map continued to show no synthetic or inferred project markers.

## 25 August 2026 — Portfolio and Quality State Pass

The Portfolio command centre now distinguishes loading, retryable error, and unavailable states instead of treating every null response as loading. The Data Quality route now likewise supplies explicit loading, retryable error, and empty validation-profile states. Their healthy portfolio and quality views were visually rechecked at 1280 × 720 after the changes, with the hierarchy ribbon, readable command rail, and synthetic-data notice intact.

## 25 August 2026 — Project and Warning State Pass

Project Explorer now supplies explicit loading, retryable-error, and no-register states before presenting its Leaflet review-zone and drill-through controls. The Alert Center and Risk Monitor now supply the same operational states for their controlled warning register. Healthy `/register`, `/warnings`, and `/risk-monitor` views were visually validated at 1280 × 720; the explorer retained its native two-click review-zone guidance and the warning queues retained controlled filter/export controls.

## 25 August 2026 — Named-Route Sweep, Part One

The first eight authoritative routes were visually checked at 1280 × 720: `/portfolio`, `/register`, `/intelligence`, `/risk-map`, `/warnings`, `/reviews`, `/signals`, and `/evidence`. Each resolved to its intended functional workspace and active journey stage. The risk map retained its no-authorised-coordinate overlay; Reviews showed a controlled empty board and dossier; Intelligence showed the signed-in archive empty state; and Evidence showed the explicit withheld-artifact state when the FastAPI sidecar was unavailable rather than fabricated metrics.

## 25 August 2026 — Named-Route Sweep, Part Two

The remaining authoritative routes were visually checked at 1280 × 720: `/import`, `/quality`, `/workflow-settings`, `/account`, `/admin`, and `/presentation`. Import showed its worksheet-aware 5 MB governed intake state; Quality showed the loaded synthetic validation profile; Workflow Settings resolved to the functional review board; Account showed real sign-in metadata and secure sign-out; and Administration showed manual plus consent-checked CSV coordinate intake. Presentation displayed its route-specific Portfolio → Risk continuation. Together with Part One, the full named-route visual sweep is complete.

## 25 August 2026 — Final State-Boundary Pass

The Risk Map now distinguishes coordinate-register loading and failure from its deliberate no-authorised-coordinate overlay. Model Evidence distinguishes a failed governed request from the intentional no-sidecar evidence boundary; governed Import History distinguishes loading, retryable failure, and empty archive; Account retains managed-authentication identity while surfacing a retryable persisted-profile failure; and Reviews distinguish acceptable-use loading/failure from an actual acknowledgement requirement. Type checking and the governed-workspace regression suite passed after these state-boundary changes.

## 25 August 2026 — Protected Documentation and Local Persona Pass

The rebuilt `/documentation` workspace was visually verified at 1280 × 720. It now renders the requested method-documentation header, Demo/Synthetic data status, methodology and safeguard panels, and four operational workflow cards for governed import, local simulation personas, account access, and administration. The route has a managed sign-in-required branch; authenticated users remain subject to the persistent acceptable-use gate before operational workspaces are usable.

`/workflow-settings` is now a dedicated local working-persona setup workspace rather than an alias to Reviews. It was visually verified with the visible dark-rail selector, three built-in simulation lenses, custom-persona form, local-only label, and explicit boundary that it cannot change database-backed access. `/reviews` was rechecked with the active local persona displayed and persona-scoped simulation controls hidden when the selected lens lacks the corresponding capability; server-side authenticated role checks remain the authority for any actual mutation.

The documented destination routes were also checked at 1280 × 720. `/account` showed the current managed identity record, notification preferences, and secure sign-out; `/admin` showed the persisted acceptable-use gate ahead of its administrator controls; and `/import` showed the 5 MB worksheet-aware governed intake surface with required mapping and source-archive boundaries. TypeScript, diff hygiene, and 42 managed Vitest tests passed after this pass.
