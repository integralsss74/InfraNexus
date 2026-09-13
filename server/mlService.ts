import type { DemoProject } from "./demoData";

type MLPayload = {
  project_id?: string;
  sector: string;
  approved_cost?: number;
  physical_progress: number;
  financial_progress: number;
  planned_progress: number;
  milestones_delayed: number;
  extensions: number;
  duration_utilization: number;
  clearance_status: "Cleared" | "Conditional" | "Pending";
  contractor_status: "Stable" | "At risk" | "Under review";
  expenditure_ratio: number;
  risk_acceleration: number;
};

export type MLPrediction = {
  costOverrunProbability: number;
  predictedCostOverrunPercentage: number;
  predictedFinalCost: number | null;
  delayProbability: number;
  predictedDelayMonths: number;
  costRisk: number;
  timeRisk: number;
  implementationRisk: number;
  overallRisk: number;
  riskCategory: "Low" | "Moderate" | "High" | "Critical";
  modelVersion: string;
  datasetLabel: string;
  simulation: boolean;
  disclaimer: string;
  source: "fastapi" | "typescript-demo-fallback";
};

export type MLExplanation = {
  method: string;
  explanationAvailable: boolean;
  positiveContributors: Array<{ feature: string; value: number; contribution: number; direction: "positive" | "negative" }>;
  negativeContributors: Array<{ feature: string; value: number; contribution: number; direction: "positive" | "negative" }>;
  featureValues: Array<{ feature: string; value: number; contribution: number; direction: "positive" | "negative" }>;
  signedContributions: Array<{ feature: string; value: number; contribution: number; direction: "positive" | "negative" }>;
  baseValue: number | null;
  predictedOutput: number | null;
  additivityResidual: number | null;
  modelVersion: string;
  datasetLabel: string;
  disclaimer: string;
  source: "fastapi" | "typescript-demo-fallback";
};

function baseUrl() {
  return process.env.ML_SERVICE_URL?.replace(/\/$/, "") ?? "";
}

function asPayload(project: DemoProject, overrides: Partial<MLPayload> = {}): MLPayload {
  return {
    project_id: project.id,
    sector: project.sector,
    approved_cost: project.approvedCost,
    physical_progress: project.physicalProgress,
    financial_progress: project.financialProgress,
    planned_progress: project.plannedProgress,
    milestones_delayed: project.milestonesDelayed,
    extensions: project.extensions,
    duration_utilization: Math.min(200, Math.round((project.durationElapsed / Math.max(1, project.durationMonths)) * 100)),
    clearance_status: project.clearance,
    contractor_status: project.contractor,
    expenditure_ratio: project.financialProgress,
    risk_acceleration: project.trend === "Rapidly deteriorating" ? 24 : project.trend === "Deteriorating" ? 11 : project.trend === "Improving" ? -6 : 2,
    ...overrides,
  };
}

function fallbackPrediction(project: DemoProject, simulation = false): MLPrediction {
  const costRisk = project.costRisk;
  const timeRisk = project.delayRisk;
  return {
    costOverrunProbability: Math.min(99, Math.round(project.predictedCostOverrun * 2.3 + 21)),
    predictedCostOverrunPercentage: project.predictedCostOverrun,
    predictedFinalCost: Math.round(project.revisedCost * (1 + project.predictedCostOverrun / 100) * 100) / 100,
    delayProbability: Math.min(99, Math.round(project.delayMonths * 6.4 + 18)),
    predictedDelayMonths: project.delayMonths,
    costRisk,
    timeRisk,
    implementationRisk: project.implementationRisk,
    overallRisk: project.overallRisk,
    riskCategory: project.riskCategory,
    modelVersion: "typescript-demo-fallback-v1",
    datasetLabel: "Synthetic Demonstration Dataset",
    simulation,
    disclaimer: "Analytical output from a synthetic demonstration calculation; not an official Government of India decision.",
    source: "typescript-demo-fallback",
  };
}

function fallbackExplanation(project: DemoProject): MLExplanation {
  const physicalGap = Math.max(0, project.plannedProgress - project.physicalProgress);
  const factors = [
    { feature: "Physical Progress Below Plan", value: physicalGap, contribution: Math.max(4, Math.round(physicalGap * 1.2)), direction: "positive" as const },
    { feature: "Financial / Physical Gap", value: project.financialProgress - project.physicalProgress, contribution: Math.round((project.financialProgress - project.physicalProgress) * 0.9), direction: project.financialProgress >= project.physicalProgress ? "positive" as const : "negative" as const },
    { feature: "Delayed Milestones", value: project.milestonesDelayed, contribution: project.milestonesDelayed * 8, direction: "positive" as const },
    { feature: "Time Extensions", value: project.extensions, contribution: project.extensions * 7, direction: "positive" as const },
  ];
  return {
    method: "Transparent demonstration contribution model (not TreeSHAP)",
    explanationAvailable: false,
    positiveContributors: factors.filter((item) => item.direction === "positive").sort((a, b) => b.contribution - a.contribution),
    negativeContributors: factors.filter((item) => item.direction === "negative").sort((a, b) => a.contribution - b.contribution),
    featureValues: factors,
    signedContributions: factors,
    baseValue: null,
    predictedOutput: null,
    additivityResidual: null,
    modelVersion: "typescript-demo-fallback-v1",
    datasetLabel: "Synthetic Demonstration Dataset",
    disclaimer: "Explanation applies to synthetic demonstration calculations and is not an official decision rule.",
    source: "typescript-demo-fallback",
  };
}

async function request<T>(path: string, payload: MLPayload): Promise<T | null> {
  const url = baseUrl();
  if (!url) return null;
  try {
    const response = await fetch(`${url}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(1800),
    });
    if (!response.ok) return null;
    return await response.json() as T;
  } catch {
    return null;
  }
}

async function requestGet<T>(path: string): Promise<T | null> {
  const url = baseUrl();
  if (!url) return null;
  try {
    const response = await fetch(`${url}${path}`, { signal: AbortSignal.timeout(1800) });
    if (!response.ok) return null;
    return await response.json() as T;
  } catch {
    return null;
  }
}

export async function predictionFor(project: DemoProject, overrides: Partial<MLPayload> = {}, simulation = false): Promise<MLPrediction> {
  const result = await request<Omit<MLPrediction, "source">>(simulation ? "/v1/simulate" : "/v1/predict", asPayload(project, overrides));
  return result ? { ...result, source: "fastapi" } : fallbackPrediction(project, simulation);
}

export async function explanationFor(project: DemoProject): Promise<MLExplanation> {
  const result = await request<Omit<MLExplanation, "source">>("/v1/explain", asPayload(project));
  return result ? { ...result, source: "fastapi" } : fallbackExplanation(project);
}

export async function modelCardFor(): Promise<{ source: "fastapi" | "typescript-demo-fallback"; modelVersion: string; datasetLabel: string; metrics: Record<string, unknown>; trainingProtocol: string; limitations: string }> {
  const url = baseUrl();
  if (url) {
    try {
      const response = await fetch(`${url}/v1/model-card`, { signal: AbortSignal.timeout(1800) });
      if (response.ok) return { ...(await response.json() as Omit<Awaited<ReturnType<typeof modelCardFor>>, "source">), source: "fastapi" };
    } catch {
      // The controlled local fallback below keeps the existing workspace fully available.
    }
  }
  return {
    source: "typescript-demo-fallback",
    modelVersion: "typescript-demo-fallback-v1",
    datasetLabel: "Synthetic Demonstration Dataset",
    metrics: {},
    trainingProtocol: "Controlled deterministic demonstration calculation; no external service configured.",
    limitations: "Configure ML_SERVICE_URL to use the local FastAPI trained-model sidecar.",
  };
}

export type MLModelEvidence = {
  datasetLabel: string;
  modelVersion: string;
  trainingProtocol: string;
  rocCurve: { target: string; falsePositiveRate: number[]; truePositiveRate: number[]; thresholds: number[]; auc: number };
  confusionMatrix: { target: string; labels: string[]; matrix: number[][]; threshold: number };
  featureImportance: Array<{ feature: string; importance: number }>;
  disclaimer: string;
  source: "fastapi" | "unavailable";
};

export async function modelEvidenceFor(): Promise<MLModelEvidence | null> {
  const result = await requestGet<Omit<MLModelEvidence, "source">>("/v1/model-evidence");
  return result ? { ...result, source: "fastapi" } : null;
}
