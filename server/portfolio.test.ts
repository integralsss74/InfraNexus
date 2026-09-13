import { describe, expect, it } from "vitest";
import { answerQuestion, listProjects, portfolioOverview, projectDetail, simulateRisk } from "./demoData";
import { portfolioRouter, previewSpreadsheet } from "./routers/portfolio";

describe("synthetic portfolio service", () => {
  it("provides a 1,000-plus project portfolio with deterministic search", () => {
    const result = listProjects({ query: "Narmada", page: 1, pageSize: 10 });
    expect(result.total).toBeGreaterThan(0);
    expect(result.rows[0]?.id).toBe("P-0004");
  });

  it("filters the portfolio by the state group resolved from a custom review zone", () => {
    const result = listProjects({ states: ["Maharashtra", "Gujarat"], page: 1, pageSize: 50 });
    expect(result.total).toBeGreaterThan(0);
    expect(result.rows.every(project => ["Maharashtra", "Gujarat"].includes(project.state))).toBe(true);
  });

  it("filters the portfolio by a custom review-zone bounding box", () => {
    const result = listProjects({ reviewZone: { north: 20, south: 18, east: 74, west: 72 }, page: 1, pageSize: 50 });
    expect(result.total).toBeGreaterThan(0);
    expect(result.rows.every(project => project.latitude <= 20 && project.latitude >= 18 && project.longitude <= 74 && project.longitude >= 72)).toBe(true);
  });

  it("filters a heatmap drill-through segment by observed month range and risk level", () => {
    const result = listProjects({ sector: "Water & Sanitation", risk: "Critical", monthStart: "Jan 2026", monthEnd: "Aug 2026", page: 1, pageSize: 50 });
    expect(result.total).toBeGreaterThan(0);
    expect(result.rows.every(project => project.sector === "Water & Sanitation")).toBe(true);
  });

  it("returns project-level explainability information", () => {
    const detail = projectDetail("P-0004");
    expect(detail?.contributors.length).toBeGreaterThan(3);
    expect(detail?.alerts.length).toBeGreaterThan(1);
  });

  it("keeps each risk-heatmap row internally consistent and covers the full portfolio", () => {
    const overview = portfolioOverview();
    expect(overview.riskHeatmap.length).toBeGreaterThan(5);
    expect(overview.riskHeatmap.every(row => row.total === row.cells.reduce((sum, cell) => sum + cell.count, 0))).toBe(true);
    expect(overview.riskHeatmap.reduce((sum, row) => sum + row.total, 0)).toBe(overview.kpis.totalProjects);
  });

  it("attaches governed model prediction and explanation provenance to a project dossier", async () => {
    const caller = portfolioRouter.createCaller({} as any);
    const detail = await caller.project({ projectId: "P-0004" });
    expect(detail?.modelPrediction.source).toMatch(/fastapi|typescript-demo-fallback/);
    expect(detail?.modelPrediction.modelVersion).toBeTruthy();
    expect(detail?.modelExplanation.positiveContributors.length).toBeGreaterThan(0);
    expect(detail?.modelExplanation.datasetLabel).toBe("Synthetic Demonstration Dataset");
  });

  it("lowers risk when controlled simulation inputs improve", () => {
    const simulated = simulateRisk({ projectId: "P-0004", physicalProgress: 65, financialProgress: 67, delayedMilestones: 1, extensions: 0, clearance: "Cleared" });
    expect(simulated.overallRisk).toBeLessThan(simulated.baseline);
    expect(simulated.explanation).toHaveLength(4);
    expect(simulated.explanation[3]).toContain("35%");
  });

  it("returns a concise calculation explanation through the simulator procedure", async () => {
    const caller = portfolioRouter.createCaller({} as any);
    const result = await caller.simulate({ projectId: "P-0004", physicalProgress: 38, financialProgress: 81, delayedMilestones: 6, extensions: 3, clearance: "Pending" });
    expect(result.calculationExplanation).toHaveLength(4);
    expect(result.calculationExplanation[0]).toContain("Cost risk starts at 16");
  });

  it("does not invent answers outside controlled question types", () => {
    expect(answerQuestion("Who will win the next election?").answer).toContain("Insufficient project data available");
  });

  it("answers state-level risk and alert questions using only portfolio records", () => {
    const risks = answerQuestion("Show critical projects in Maharashtra");
    const alerts = answerQuestion("Which alerts are active in Maharashtra?");
    expect(risks.answer).toContain("Maharashtra");
    expect(alerts.answer).toContain("Maharashtra");
    expect(alerts.sources.length).toBeGreaterThan(0);
  });

  it("validates required governed source fields before a mapping is stored", () => {
    const preview = previewSpreadsheet(Buffer.from("project_name,sector,agency\nSample Corridor,Roads,National Highways Authority", "utf8"));
    expect(preview.validationStatus).toBe("validated");
    expect(preview.rowsDetected).toBe(1);
    expect(preview.mappedFields).toHaveLength(3);
    expect(preview.selectedWorksheet).toBeTruthy();
  });
});
