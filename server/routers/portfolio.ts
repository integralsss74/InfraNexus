import { z } from "zod";
import { addAuditEvent, createImportFile, listImportFiles } from "../db";
import { acknowledgeAlert, allAlerts, answerQuestion, benchmark, listProjects, portfolioOverview, projectDetail, simulateRisk, taxonomy } from "../demoData";
import { storagePut } from "../storage";
import { publicProcedure, router } from "../_core/trpc";
import { explanationFor, modelCardFor, modelEvidenceFor, predictionFor } from "../mlService";
import { answerWithGroundedAssistant } from "../assistantService";
import * as XLSX from "xlsx";

const importMemory: Array<{ id: string; originalFilename: string; storageUrl: string; mimeType: string; sizeBytes: number; rowsDetected: number; validationStatus: string; createdAt: string }> = [];
const importRequiredFields = ["project_name", "sector", "agency"] as const;
const importFileLimitBytes = 5_000_000;

export function previewSpreadsheet(bytes: Buffer, requestedWorksheet?: string) {
  const workbook = XLSX.read(bytes, { type: "buffer" });
  const sheetNames = workbook.SheetNames;
  const selectedWorksheet = requestedWorksheet && sheetNames.includes(requestedWorksheet) ? requestedWorksheet : sheetNames[0] ?? "";
  const worksheet = workbook.Sheets[selectedWorksheet];
  if (!worksheet) return { sheetNames, selectedWorksheet, columns: [], preview: [], rowsDetected: 0, missingValues: 0, invalidRows: 0, mappedFields: [], validationStatus: "rejected" as const };
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: "" });
  const columns = (rawRows[0] ?? []).map(item => String(item).trim()).filter(Boolean);
  const rows = rawRows.slice(1).filter(row => row.some(cell => String(cell).trim())).map(row => row.map(cell => String(cell).trim()));
  const missingValues = rows.reduce((count, row) => count + row.filter(cell => !cell).length, 0);
  const mappedFields = columns.filter(column => importRequiredFields.includes(column.toLowerCase().replaceAll(" ", "_") as typeof importRequiredFields[number]));
  const invalidRows = rows.filter(row => row.length !== columns.length || importRequiredFields.some(field => { const columnIndex = columns.findIndex(column => column.toLowerCase().replaceAll(" ", "_") === field); return columnIndex >= 0 && !row[columnIndex]; })).length;
  return { sheetNames, selectedWorksheet, columns, preview: rows.slice(0, 5), rowsDetected: rows.length, missingValues, invalidRows, mappedFields, validationStatus: columns.length ? (mappedFields.length === importRequiredFields.length && invalidRows === 0 ? "validated" : "needs_mapping") : "rejected" as const };
}

export const portfolioRouter = router({
  overview: publicProcedure.query(() => portfolioOverview()),
  taxonomy: publicProcedure.query(() => taxonomy),
  projects: publicProcedure.input(z.object({ query: z.string().optional(), sector: z.string().optional(), state: z.string().optional(), states: z.array(z.string()).max(24).optional(), reviewZone: z.object({ north: z.number(), south: z.number(), east: z.number(), west: z.number() }).optional(), risk: z.string().optional(), status: z.string().optional(), monthStart: z.string().optional(), monthEnd: z.string().optional(), page: z.number().optional(), pageSize: z.number().optional(), sort: z.string().optional() })).query(({ input }) => listProjects(input)),
  project: publicProcedure.input(z.object({ projectId: z.string() })).query(async ({ input }) => {
    const detail = projectDetail(input.projectId);
    if (!detail) return null;
    const [modelPrediction, modelExplanation] = await Promise.all([predictionFor(detail.project), explanationFor(detail.project)]);
    return { ...detail, modelPrediction, modelExplanation };
  }),
  alerts: publicProcedure.input(z.object({ search: z.string().optional(), severity: z.string().optional(), acknowledged: z.string().optional() }).optional()).query(({ input }) => allAlerts().filter(alert => (!input?.search || `${alert.projectName} ${alert.type}`.toLowerCase().includes(input.search.toLowerCase())) && (!input?.severity || input.severity === "All" || alert.severity === input.severity) && (!input?.acknowledged || input.acknowledged === "All" || String(alert.acknowledged) === input.acknowledged))),
  acknowledgeAlert: publicProcedure.input(z.object({ alertId: z.string() })).mutation(async ({ input, ctx }) => {
    const result = acknowledgeAlert(input.alertId);
    if (ctx.user) await addAuditEvent(ctx.user.id, "alert_acknowledged", "alert", input.alertId, "Analytical acknowledgement recorded in the synthetic demonstration workspace.");
    return result;
  }),
  prediction: publicProcedure.input(z.object({ projectId: z.string() })).query(async ({ input }) => {
    const detail = projectDetail(input.projectId);
    if (!detail) throw new Error("Project not found");
    return predictionFor(detail.project);
  }),
  explanation: publicProcedure.input(z.object({ projectId: z.string() })).query(async ({ input }) => {
    const detail = projectDetail(input.projectId);
    if (!detail) throw new Error("Project not found");
    return explanationFor(detail.project);
  }),
  modelCard: publicProcedure.query(() => modelCardFor()),
  simulate: publicProcedure.input(z.object({ projectId: z.string().optional(), physicalProgress: z.number().min(0).max(100), financialProgress: z.number().min(0).max(100), delayedMilestones: z.number().min(0).max(20), extensions: z.number().min(0).max(10), clearance: z.enum(["Cleared", "Conditional", "Pending"]) })).mutation(async ({ input }) => {
    const baseline = simulateRisk(input);
    const detail = projectDetail(input.projectId ?? "P-0004");
    if (!detail) return { ...baseline, calculationExplanation: baseline.explanation, modelSource: "typescript-demo-fallback" as const };
    const model = await predictionFor(detail.project, { physical_progress: input.physicalProgress, financial_progress: input.financialProgress, milestones_delayed: input.delayedMilestones, extensions: input.extensions, clearance_status: input.clearance }, true);
    if (model.source === "typescript-demo-fallback") {
      return { ...baseline, calculationExplanation: baseline.explanation, modelSource: model.source, modelVersion: model.modelVersion, disclaimer: model.disclaimer };
    }
    return { ...baseline, calculationExplanation: baseline.explanation, costRisk: model.costRisk, delayRisk: model.timeRisk, implementationRisk: model.implementationRisk, overallRisk: model.overallRisk, category: model.riskCategory, delta: Math.round((model.overallRisk - detail.project.overallRisk) * 10) / 10, modelSource: model.source, modelVersion: model.modelVersion, disclaimer: model.disclaimer };
  }),
  benchmark: publicProcedure.input(z.object({ groupBy: z.enum(["ministry", "sector", "state", "agency"]) })).query(({ input }) => benchmark(input.groupBy)),
  ask: publicProcedure.input(z.object({ question: z.string().min(1).max(500) })).mutation(async ({ input }) => answerWithGroundedAssistant(input.question, answerQuestion(input.question))),
  dataQuality: publicProcedure.query(() => ({ score: 96.4, projects: 1248, monthlyRecords: 9984, missingValues: 1.8, duplicates: 0.2, invalidDates: 0.0, outliers: 2.7, note: "Quality figures relate to the Synthetic Demonstration Dataset validation profile." })),
  modelPerformance: publicProcedure.query(async () => {
    const card = await modelCardFor();
    return { source: card.source, modelVersion: card.modelVersion, datasetLabel: card.datasetLabel, metrics: card.metrics, methodology: card.trainingProtocol, limitations: card.limitations };
  }),
  modelEvidence: publicProcedure.query(async () => modelEvidenceFor()),
  importPreview: publicProcedure.input(z.object({ filename: z.string().max(255), contentBase64: z.string().min(1).max(7_000_000), worksheetName: z.string().min(1).max(255).optional() })).mutation(({ input }) => {
    const bytes = Buffer.from(input.contentBase64, "base64");
    if (bytes.byteLength > importFileLimitBytes) throw new Error("Source file exceeds the 5 MB governed import limit.");
    return previewSpreadsheet(bytes, input.worksheetName);
  }),
  importSource: publicProcedure.input(z.object({ filename: z.string().min(1).max(255), contentType: z.enum(["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]), contentBase64: z.string().min(1).max(7_000_000), worksheetName: z.string().min(1).max(255).optional(), mapping: z.record(z.string(), z.string()) })).mutation(async ({ input, ctx }) => {
    const safeFilename = input.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const bytes = Buffer.from(input.contentBase64, "base64");
    if (bytes.byteLength > importFileLimitBytes) throw new Error("Source file exceeds the 5 MB governed import limit.");
    if (importRequiredFields.some(field => !input.mapping[field] || input.mapping[field] === "unmapped")) throw new Error("Map project name, sector, and agency before storing a governed source file.");
    const preview = previewSpreadsheet(bytes, input.worksheetName);
    const storage = await storagePut(`project-imports/${Date.now()}-${safeFilename}`, bytes, input.contentType);
    const userId = ctx.user?.openId ?? "demo-public-workspace";
    const saved = await createImportFile({ originalFilename: input.filename, storageKey: storage.key, storageUrl: storage.url, mimeType: input.contentType, sizeBytes: bytes.byteLength, rowsDetected: preview.rowsDetected, validationStatus: preview.validationStatus as "validated" | "needs_mapping" | "rejected", columnMapping: JSON.stringify({ ...input.mapping, worksheetName: preview.selectedWorksheet }), importedBy: userId, importCompleted: false });
    const item = { id: saved ? String(saved.id) : `MEM-${Date.now()}`, originalFilename: input.filename, storageUrl: storage.url, mimeType: input.contentType, sizeBytes: bytes.byteLength, rowsDetected: preview.rowsDetected, validationStatus: saved?.validationStatus ?? preview.validationStatus, createdAt: saved?.createdAt.toISOString() ?? new Date().toISOString() };
    if (!saved) importMemory.unshift(item);
    return { item, preview, message: "Source file stored outside the database; validation metadata recorded for controlled import review." };
  }),
  importHistory: publicProcedure.query(async () => {
    const persisted = await listImportFiles();
    return [...importMemory, ...persisted.map(item => ({ ...item, createdAt: item.createdAt.toISOString() }))];
  }),
});
