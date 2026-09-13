const TERMS = [
  { term: "ROC-AUC", definition: "A threshold-independent summary of how well a classifier ranks positive cases above negative cases. In PAIMANA it is reported only for the deterministic synthetic hold-out evaluation, not as a claim about live project performance." },
  { term: "Additivity residual", definition: "The numerical difference after subtracting the base value and the summed TreeSHAP contributions from the prediction. A value close to zero is the expected reconciliation check, subject to floating-point precision." },
  { term: "Feature attribution", definition: "The signed amount assigned to an input by TreeSHAP for one model output. Positive values move that model prediction above its base value; negative values move it below. Attribution describes model behavior, not causation." },
  { term: "Feature importance", definition: "A global indicator of how frequently or effectively an input supports model splits across a fitted estimator. It differs from a per-project TreeSHAP attribution and is not causal evidence." },
  { term: "Model evidence", definition: "A governed record of model version, evaluation method, dataset boundary, and explanation output. PAIMANA labels the demonstration dataset and withholds unavailable evidence rather than fabricating it." },
];

export function ModelEvidenceGlossary() {
  return <section aria-label="Model evaluation glossary" className="space-y-2">{TERMS.map(({ term, definition }) => <details key={term} className="group rounded-lg border border-[#e0e9f0] bg-[#fbfdfe] px-3 py-2"><summary className="cursor-pointer list-none text-xs font-semibold text-[#315b7d] marker:hidden">{term}<span className="float-right text-[#63819a] group-open:rotate-45">+</span></summary><p className="mt-2 border-t border-[#e8eef3] pt-2 text-[11px] leading-5 text-[#5f768b]">{definition}</p></details>)}</section>;
}
