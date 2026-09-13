import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { acceptUsePolicy, addAuditEvent, approvePortfolioBrief, createInterventionCase, createPortfolioBrief, getNotificationPreferences, getUserByOpenId, hasAcceptedUsePolicy, listActiveAuthorizedCoordinates, listAuditEvents, listAuthorizedCoordinates, listInterventionCases, listInterventionEvents, listPortfolioBriefs, listReviewFilters, publishAuthorizedCoordinate, saveNotificationPreferences, saveReviewFilter, submitInterventionResponse, transitionInterventionCase, upsertUser } from "./db";
import { portfolioRouter } from "./routers/portfolio";
import { configuredProductionGatewayUrl, requestProductionGateway, verifyProductionGateway } from "./productionGateway";
import { projectDetail } from "./demoData";
import { explanationFor, predictionFor } from "./mlService";

const defaultPreferences = { criticalEnabled: true, highEnabled: true, digestMode: "daily" as const };
const acceptableUsePolicyVersion = "2026-08";
const interventionStatuses = ["New", "Awaiting agency", "Response received", "Under review", "Intervention approved", "Closed"] as const;

async function requireAcceptableUse(userId: number) {
  if (!await hasAcceptedUsePolicy(userId, acceptableUsePolicyVersion)) throw new Error("Accept the governed-use policy before performing operational write actions.");
}

async function groundedBriefFor(projectId: string) {
  const detail = projectDetail(projectId);
  if (!detail) throw new Error("Project evidence was not found for this brief.");
  const { project, alerts, contributors, recommendations } = detail;
  const [modelPrediction, modelExplanation] = await Promise.all([predictionFor(project), explanationFor(project)]);
  const title = `${project.name} — risk review brief`;
  const content = [
    `## Portfolio context\n${project.id} is a ${project.sector} project in ${project.state} with an overall synthetic analytical risk of ${project.overallRisk}/100 (${project.riskCategory}).`,
    `## Delivery posture\nPhysical progress is ${project.physicalProgress}% against ${project.plannedProgress}% planned progress; financial progress is ${project.financialProgress}%. The registered synthetic trajectory is ${project.trend.toLowerCase()}.`,
    `## Model signal\n${modelPrediction.source === "fastapi" ? `${modelPrediction.modelVersion} reports an overall analytical risk of ${modelPrediction.overallRisk}/100.` : "The managed transparent demonstration fallback is active; this brief does not label its contribution values as TreeSHAP."} ${modelPrediction.disclaimer}`,
    `## Early warnings\n${alerts.length ? alerts.map(alert => `- ${alert.severity}: ${alert.type} — ${alert.message}`).join("\n") : "No active synthetic early-warning records are registered for this project."}`,
    `## Evidence drivers\n${contributors.slice(0, 5).map(item => `- ${item.feature}: ${item.direction === "positive" ? "+" : ""}${item.contribution} (${String(item.value)})`).join("\n")}`,
    `## Review prompts\n${recommendations.map(recommendation => `- ${recommendation}`).join("\n")}`,
    "## Governance boundary\nThis brief is grounded in the Synthetic Demonstration Dataset and registered project evidence. It is an analytical review aid, not an official decision, instruction, or causal conclusion.",
  ].join("\n\n");
  const evidence = { projectId: project.id, projectName: project.name, projectRisk: project.overallRisk, riskCategory: project.riskCategory, alertIds: alerts.map(alert => alert.id), contributorFeatures: contributors.slice(0, 5).map(item => item.feature), modelVersion: modelPrediction.modelVersion, explanationMethod: modelExplanation.method, datasetLabel: "Synthetic Demonstration Dataset" };
  return { title, content, evidence };
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    loginDemo: publicProcedure
      .input(z.object({
        role: z.enum(["admin", "analyst", "user"]).optional(),
        name: z.string().optional(),
        email: z.string().optional(),
      }).optional())
      .mutation(async ({ ctx, input }) => {
        const role = input?.role ?? "admin";
        const name = input?.name || (role === "admin" ? "MoSPI Administrator" : role === "analyst" ? "Senior Risk Analyst" : "Project Officer");
        const email = input?.email || (role === "admin" ? "admin@mospi.gov.in" : "analyst@mospi.gov.in");
        const openId = `demo-${role}-${Date.now()}`;

        await upsertUser({
          openId,
          name,
          email,
          loginMethod: "Demo Workspace Auth",
          lastSignedIn: new Date(),
        });

        const user = await getUserByOpenId(openId);
        const sessionToken = await sdk.createSessionToken(openId, {
          name,
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true, user };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  userWorkspace: router({
    profile: protectedProcedure.query(async ({ ctx }) => {
      const preferences = await getNotificationPreferences(ctx.user.id);
      return { user: ctx.user, preferences: preferences ?? defaultPreferences, persisted: Boolean(preferences) };
    }),
    notificationPreferences: protectedProcedure.query(async ({ ctx }) => {
      const preferences = await getNotificationPreferences(ctx.user.id);
      return preferences ?? defaultPreferences;
    }),
    saveNotificationPreferences: protectedProcedure.input(z.object({ criticalEnabled: z.boolean(), highEnabled: z.boolean(), digestMode: z.enum(["instant", "daily", "weekly"]) })).mutation(async ({ ctx, input }) => {
      const preferences = await saveNotificationPreferences(ctx.user.id, input);
      await addAuditEvent(ctx.user.id, "notification_preferences_updated", "notification_preferences", String(ctx.user.id), `Critical: ${input.criticalEnabled}; high: ${input.highEnabled}; digest: ${input.digestMode}.`);
      return preferences ?? input;
    }),
    auditHistory: protectedProcedure.input(z.object({ limit: z.number().min(1).max(200).optional() }).optional()).query(async ({ ctx, input }) => listAuditEvents(ctx.user.id, input?.limit ?? 80)),
    acceptableUse: protectedProcedure.query(async ({ ctx }) => ({ policyVersion: acceptableUsePolicyVersion, accepted: await hasAcceptedUsePolicy(ctx.user.id, acceptableUsePolicyVersion) })),
    acceptAcceptableUse: protectedProcedure.mutation(async ({ ctx }) => {
      const acknowledgement = await acceptUsePolicy(ctx.user.id, acceptableUsePolicyVersion);
      await addAuditEvent(ctx.user.id, "acceptable_use_acknowledged", "policy", acceptableUsePolicyVersion, "User confirmed governed-use, synthetic-data, and evidence-handling constraints.");
      return acknowledgement ?? { accepted: false, policyVersion: acceptableUsePolicyVersion };
    }),
    interventionCases: protectedProcedure.query(async ({ ctx }) => listInterventionCases(ctx.user.id, ctx.user.role === "admin")),
    createIntervention: protectedProcedure.input(z.object({ projectId: z.string().min(1).max(32), ownerUserId: z.number().int().positive().optional(), dueAt: z.date().optional() })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Administrator role required to create an intervention review.");
      await requireAcceptableUse(ctx.user.id);
      const id = `IR-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const record = await createInterventionCase({ id, ...input }, ctx.user);
      await addAuditEvent(ctx.user.id, "intervention_created", "intervention_case", id, `Created governed review for ${input.projectId}.`);
      return record ?? { id, projectId: input.projectId, status: "New", persisted: false };
    }),
    transitionIntervention: protectedProcedure.input(z.object({ id: z.string().min(1).max(64), status: z.enum(interventionStatuses) })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Administrator role required to transition an intervention review.");
      await requireAcceptableUse(ctx.user.id);
      const record = await transitionInterventionCase(input.id, input.status, ctx.user);
      await addAuditEvent(ctx.user.id, "intervention_status_changed", "intervention_case", input.id, `Status changed to ${input.status}.`);
      return record ?? { id: input.id, status: input.status, persisted: false };
    }),
    submitInterventionResponse: protectedProcedure.input(z.object({ id: z.string().min(1).max(64), response: z.string().trim().min(1).max(6000) })).mutation(async ({ ctx, input }) => {
      await requireAcceptableUse(ctx.user.id);
      const record = await submitInterventionResponse(input.id, input.response, ctx.user);
      await addAuditEvent(ctx.user.id, "intervention_response_submitted", "intervention_case", input.id, "Submitted a governed review response and moved the case to Response received.");
      return record ?? { id: input.id, agencyResponse: input.response, status: "Response received", persisted: false };
    }),
    interventionEvents: protectedProcedure.input(z.object({ interventionId: z.string().min(1).max(64) })).query(async ({ input }) => listInterventionEvents(input.interventionId)),
    authorizedCoordinates: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Administrator role required to view authorised coordinate governance records.");
      return listAuthorizedCoordinates();
    }),
    activeAuthorizedCoordinates: protectedProcedure.query(async () => listActiveAuthorizedCoordinates()),
    publishAuthorizedCoordinate: protectedProcedure.input(z.object({ projectId: z.string().min(1).max(64), latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), precision: z.enum(["district", "project"]), sourceName: z.string().min(1).max(255), authorityReference: z.string().min(1).max(255), consentConfirmed: z.literal(true) })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Administrator role required to publish authorised coordinates.");
      await requireAcceptableUse(ctx.user.id);
      const record = await publishAuthorizedCoordinate({ ...input, latitude: input.latitude.toFixed(6), longitude: input.longitude.toFixed(6) }, ctx.user.id);
      await addAuditEvent(ctx.user.id, "authorised_coordinate_published", "authorized_coordinate", input.projectId, `Published ${input.precision}-precision coordinate with authority reference ${input.authorityReference}.`);
      return record ?? { ...input, active: true, persisted: false };
    }),
    publishAuthorizedCoordinateBatch: protectedProcedure.input(z.object({ rows: z.array(z.object({ projectId: z.string().min(1).max(64), latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), precision: z.enum(["district", "project"]), sourceName: z.string().min(1).max(255), authorityReference: z.string().min(1).max(255), consentConfirmed: z.literal(true) })).min(1).max(100) })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Administrator role required to publish authorised coordinates.");
      await requireAcceptableUse(ctx.user.id);
      const records = await Promise.all(input.rows.map(row => publishAuthorizedCoordinate({ ...row, latitude: row.latitude.toFixed(6), longitude: row.longitude.toFixed(6) }, ctx.user.id)));
      await addAuditEvent(ctx.user.id, "authorised_coordinate_batch_published", "authorized_coordinate", null, `Published ${input.rows.length} consent-confirmed coordinate records from a governed batch.`);
      return { published: records.filter(Boolean).length, requested: input.rows.length };
    }),
    reviewFilters: protectedProcedure.query(async ({ ctx }) => listReviewFilters(ctx.user.id)),
    saveReviewFilter: protectedProcedure.input(z.object({ name: z.string().min(1).max(128), teamName: z.string().max(128).optional(), visibility: z.enum(["private", "team"]), filterState: z.string().min(2).max(8000) })).mutation(async ({ ctx, input }) => {
      await requireAcceptableUse(ctx.user.id);
      const id = await saveReviewFilter({ ownerUserId: ctx.user.id, ...input });
      await addAuditEvent(ctx.user.id, "review_filter_saved", "review_filter", id ? String(id) : null, `Saved ${input.visibility} review filter: ${input.name}.`);
      return { id, ...input };
    }),
  }),
  productionGateway: router({
    verify: protectedProcedure.query(({ ctx }) => verifyProductionGateway(configuredProductionGatewayUrl(), ctx.user)),
    recordImport: protectedProcedure.input(z.object({ storageKey: z.string().min(3).max(512), originalFilename: z.string().min(1).max(255), checksum: z.string().max(128).optional(), recordCount: z.number().int().min(0).optional(), sourceWorksheet: z.string().max(255).optional(), headerSummary: z.array(z.string()).max(200).optional() })).mutation(async ({ ctx, input }) => {
      await requireAcceptableUse(ctx.user.id);
      return requestProductionGateway(configuredProductionGatewayUrl(), ctx.user, "/imports", { method: "POST", body: input });
    }),
    updateWorkflowStatus: protectedProcedure.input(z.object({ workflowId: z.string().min(1).max(128), status: z.enum(interventionStatuses) })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Administrator role required to update a production workflow.");
      await requireAcceptableUse(ctx.user.id);
      return requestProductionGateway(configuredProductionGatewayUrl(), ctx.user, `/workflows/${encodeURIComponent(input.workflowId)}/status`, { method: "POST", body: { status: input.status } });
    }),
    publishCoordinate: protectedProcedure.input(z.object({ projectId: z.string().min(1).max(64), latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), precision: z.enum(["district", "project"]), sourceName: z.string().min(1).max(255), authorityReference: z.string().min(1).max(255), consentConfirmed: z.literal(true) })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Administrator role required to publish a production coordinate.");
      await requireAcceptableUse(ctx.user.id);
      return requestProductionGateway(configuredProductionGatewayUrl(), ctx.user, "/coordinates", { method: "POST", body: input });
    }),
  }),
  briefs: router({
    generate: protectedProcedure.input(z.object({ projectId: z.string().min(1).max(32) })).mutation(async ({ ctx, input }) => {
      await requireAcceptableUse(ctx.user.id);
      const grounded = await groundedBriefFor(input.projectId);
      const id = `BR-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const record = await createPortfolioBrief({ id, ownerUserId: ctx.user.id, projectId: input.projectId, title: grounded.title, content: grounded.content, evidenceJson: JSON.stringify(grounded.evidence) });
      await addAuditEvent(ctx.user.id, "portfolio_brief_generated", "portfolio_brief", id, `Generated evidence-bounded brief for ${input.projectId}.`);
      return record ?? { id, ownerUserId: ctx.user.id, projectId: input.projectId, title: grounded.title, content: grounded.content, evidenceJson: JSON.stringify(grounded.evidence), status: "generated", persisted: false };
    }),
    list: protectedProcedure.query(async ({ ctx }) => listPortfolioBriefs(ctx.user.id)),
    approve: protectedProcedure.input(z.object({ id: z.string().min(1).max(64) })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Administrator role required to approve a portfolio brief.");
      await requireAcceptableUse(ctx.user.id);
      const record = await approvePortfolioBrief(input.id, ctx.user.id, ctx.user.id);
      if (!record) throw new Error("Portfolio brief was not found in this administrator workspace.");
      await addAuditEvent(ctx.user.id, "portfolio_brief_approved", "portfolio_brief", input.id, "Approved an evidence-bounded portfolio review brief.");
      return record;
    }),
  }),
  portfolio: portfolioRouter,
});

export type AppRouter = typeof appRouter;
