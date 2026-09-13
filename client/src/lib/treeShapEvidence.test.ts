import { describe, expect, it } from "vitest";
import { signedTreeShapContributionDescription, TREE_SHAP_EVIDENCE_COPY } from "./treeShapEvidence";

describe("TreeSHAP evidence tooltip copy", () => {
  it("retains the accounting and non-causal interpretation boundary", () => {
    expect(TREE_SHAP_EVIDENCE_COPY.accountingSample).toContain("base value plus real TreeSHAP feature contributions");
    expect(TREE_SHAP_EVIDENCE_COPY.signedContribution).toContain("not causation");
  });

  it("explains positive and negative contributions without presenting them as causal", () => {
    expect(signedTreeShapContributionDescription("schedule variance", 0.24)).toContain("positive TreeSHAP value raises");
    expect(signedTreeShapContributionDescription("physical progress", -0.11)).toContain("negative TreeSHAP value lowers");
    expect(signedTreeShapContributionDescription("physical progress", -0.11)).toContain("not proof");
  });
});
