export const TREE_SHAP_EVIDENCE_COPY = {
  accountingSample: "This FastAPI sample reconciles a Random Forest prediction as a base value plus real TreeSHAP feature contributions. It explains model behavior on deterministic synthetic inputs; it is not a causal finding or an official decision rule.",
  baseValue: "The expected Random Forest output before this project's shown feature values are applied. It is the reference point for every signed contribution.",
  predictedOutput: "The Random Forest estimate after the base value and all signed TreeSHAP contributions are combined for this synthetic project sample.",
  additivityResidual: "A numerical reconciliation check: predicted output minus base value minus the sum of TreeSHAP contributions. A value near zero reflects expected floating-point precision.",
  feature: "The model input whose relationship to the prediction is being described. Feature labels do not imply an official causal factor.",
  observedValue: "The synthetic input value provided to the TreeExplainer for this project. It is not a contribution or a measure of causality by itself.",
  signedContribution: "A positive value moves this model's prediction above its base value; a negative value moves it below. The magnitude is in the model output's units. It describes model attribution, not causation or a government decision.",
} as const;

export function signedTreeShapContributionDescription(feature: string, contribution: number) {
  const direction = contribution >= 0 ? "raises" : "lowers";
  return `${feature}: this ${contribution >= 0 ? "positive" : "negative"} TreeSHAP value ${direction} the Random Forest prediction relative to its base value for this synthetic sample. It is not proof that changing this factor will cause the outcome.`;
}
