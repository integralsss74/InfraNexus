import { afterEach, describe, expect, it, vi } from "vitest";
import { projectDetail } from "./demoData";
import { explanationFor, modelEvidenceFor, predictionFor } from "./mlService";

const project = projectDetail("P-0004")!.project;
const savedUrl = process.env.ML_SERVICE_URL;

afterEach(() => {
  process.env.ML_SERVICE_URL = savedUrl;
  vi.unstubAllGlobals();
});

describe("FastAPI ML adapter", () => {
  it("keeps the product functional with a controlled fallback when no sidecar is configured", async () => {
    delete process.env.ML_SERVICE_URL;
    const result = await predictionFor(project);
    const explanation = await explanationFor(project);
    expect(result.source).toBe("typescript-demo-fallback");
    expect(result.datasetLabel).toBe("Synthetic Demonstration Dataset");
    expect(explanation.positiveContributors.length).toBeGreaterThan(0);
    expect(explanation.explanationAvailable).toBe(false);
    expect(explanation.method).toContain("not TreeSHAP");
  });

  it("uses a validated FastAPI response when the sidecar is available", async () => {
    process.env.ML_SERVICE_URL = "http://ml-service.test";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ costOverrunProbability: 88, predictedCostOverrunPercentage: 24, predictedFinalCost: 150, delayProbability: 72, predictedDelayMonths: 8, costRisk: 72, timeRisk: 68, implementationRisk: 70, overallRisk: 71, riskCategory: "High", modelVersion: "sidecar-v1", datasetLabel: "Synthetic Demonstration Dataset", simulation: false, disclaimer: "Analytical output." }) }));
    const result = await predictionFor(project);
    expect(result.source).toBe("fastapi");
    expect(result.modelVersion).toBe("sidecar-v1");
    expect(result.overallRisk).toBe(71);
  });

  it("returns model evidence only from the optional FastAPI service", async () => {
    delete process.env.ML_SERVICE_URL;
    await expect(modelEvidenceFor()).resolves.toBeNull();
    process.env.ML_SERVICE_URL = "http://ml-service.test";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ datasetLabel: "Synthetic Demonstration Dataset", modelVersion: "sidecar-v1", trainingProtocol: "Time ordered", rocCurve: { target: "delay", falsePositiveRate: [0, 1], truePositiveRate: [0, 1], thresholds: [1, 0], auc: 0.81 }, confusionMatrix: { target: "delay", labels: ["On schedule", "Delayed"], matrix: [[5, 1], [1, 5]], threshold: 0.5 }, featureImportance: [{ feature: "Progress Gap", importance: 0.42 }], disclaimer: "Synthetic." }) }));
    const evidence = await modelEvidenceFor();
    expect(evidence?.source).toBe("fastapi");
    expect(evidence?.rocCurve.auc).toBe(0.81);
  });
});
