import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  addAuditEvent: vi.fn(),
  getNotificationPreferences: vi.fn(),
  listAuditEvents: vi.fn(),
  listAuthorizedCoordinates: vi.fn(),
  listActiveAuthorizedCoordinates: vi.fn(),
  createPortfolioBrief: vi.fn(),
  listPortfolioBriefs: vi.fn(),
  approvePortfolioBrief: vi.fn(),
  saveNotificationPreferences: vi.fn(),
  hasAcceptedUsePolicy: vi.fn(),
  acceptUsePolicy: vi.fn(),
  createInterventionCase: vi.fn(),
  listInterventionCases: vi.fn(),
  listInterventionEvents: vi.fn(),
  listReviewFilters: vi.fn(),
  saveReviewFilter: vi.fn(),
  publishAuthorizedCoordinate: vi.fn(),
  submitInterventionResponse: vi.fn(),
  transitionInterventionCase: vi.fn(),
}));

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return { ...actual, ...dbMocks };
});

import { appRouter } from "./routers";

const context = { user: { id: 42, openId: "test-user", name: "Test User", email: "test@example.gov.in", role: "user", lastSignedIn: new Date() }, req: {}, res: {} } as any;

describe("user workspace procedures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.hasAcceptedUsePolicy.mockResolvedValue(true);
  });

  it("returns safe default preferences when no saved row exists", async () => {
    dbMocks.getNotificationPreferences.mockResolvedValue(null);
    const caller = appRouter.createCaller(context);
    const profile = await caller.userWorkspace.profile();
    expect(profile.persisted).toBe(false);
    expect(profile.preferences).toEqual({ criticalEnabled: true, highEnabled: true, digestMode: "daily" });
  });

  it("saves preferences and writes an audit event for the signed-in user", async () => {
    const saved = { id: 1, userId: 42, criticalEnabled: false, highEnabled: true, digestMode: "weekly", updatedAt: new Date() };
    dbMocks.saveNotificationPreferences.mockResolvedValue(saved);
    const caller = appRouter.createCaller(context);
    const result = await caller.userWorkspace.saveNotificationPreferences({ criticalEnabled: false, highEnabled: true, digestMode: "weekly" });
    expect(result).toEqual(saved);
    expect(dbMocks.saveNotificationPreferences).toHaveBeenCalledWith(42, { criticalEnabled: false, highEnabled: true, digestMode: "weekly" });
    expect(dbMocks.addAuditEvent).toHaveBeenCalledWith(42, "notification_preferences_updated", "notification_preferences", "42", expect.stringContaining("weekly"));
  });

  it("returns signed-in audit history in the requested bounded range", async () => {
    const events = [{ id: 1, userId: 42, eventType: "alert_acknowledged", targetType: "alert", targetId: "A-1", detail: "Reviewed", createdAt: new Date() }];
    dbMocks.listAuditEvents.mockResolvedValue(events);
    const caller = appRouter.createCaller(context);
    await expect(caller.userWorkspace.auditHistory({ limit: 25 })).resolves.toEqual(events);
    expect(dbMocks.listAuditEvents).toHaveBeenCalledWith(42, 25);
  });

  it("records an acceptable-use acknowledgement for the signed-in workspace", async () => {
    dbMocks.acceptUsePolicy.mockResolvedValue({ accepted: true, policyVersion: "2026-08" });
    const caller = appRouter.createCaller(context);
    await expect(caller.userWorkspace.acceptAcceptableUse()).resolves.toEqual({ accepted: true, policyVersion: "2026-08" });
    expect(dbMocks.acceptUsePolicy).toHaveBeenCalledWith(42, "2026-08");
    expect(dbMocks.addAuditEvent).toHaveBeenCalledWith(42, "acceptable_use_acknowledged", "policy", "2026-08", expect.any(String));
  });

  it("rejects a governed write until the user has acknowledged the policy", async () => {
    dbMocks.hasAcceptedUsePolicy.mockResolvedValue(false);
    const adminCaller = appRouter.createCaller({ ...context, user: { ...context.user, role: "admin" } });
    await expect(adminCaller.userWorkspace.createIntervention({ projectId: "P-0004" })).rejects.toThrow("Accept the governed-use policy");
  });

  it("requires an administrator to create an intervention review", async () => {
    const userCaller = appRouter.createCaller(context);
    await expect(userCaller.userWorkspace.createIntervention({ projectId: "P-0004" })).rejects.toThrow("Administrator role required");
    const adminCaller = appRouter.createCaller({ ...context, user: { ...context.user, role: "admin" } });
    dbMocks.createInterventionCase.mockResolvedValue({ id: "IR-1", projectId: "P-0004", status: "New" });
    await expect(adminCaller.userWorkspace.createIntervention({ projectId: "P-0004" })).resolves.toEqual({ id: "IR-1", projectId: "P-0004", status: "New" });
    expect(dbMocks.createInterventionCase).toHaveBeenCalledWith(expect.objectContaining({ projectId: "P-0004" }), expect.objectContaining({ id: 42, role: "admin" }));
  });

  it("records a governed response and workflow audit entry for an assigned review", async () => {
    const response = { id: "IR-1", projectId: "P-0004", status: "Response received", agencyResponse: "Agency evidence received." };
    dbMocks.submitInterventionResponse.mockResolvedValue(response);
    const caller = appRouter.createCaller(context);
    await expect(caller.userWorkspace.submitInterventionResponse({ id: "IR-1", response: "Agency evidence received." })).resolves.toEqual(response);
    expect(dbMocks.submitInterventionResponse).toHaveBeenCalledWith("IR-1", "Agency evidence received.", expect.objectContaining({ id: 42, role: "user" }));
    expect(dbMocks.addAuditEvent).toHaveBeenCalledWith(42, "intervention_response_submitted", "intervention_case", "IR-1", expect.stringContaining("Response received"));
  });

  it("allows only administrators to publish authorised coordinates and writes an audit record", async () => {
    const userCaller = appRouter.createCaller(context);
    const payload = { projectId: "P-0004", latitude: 19.076, longitude: 72.878, precision: "project" as const, sourceName: "Authorised register", authorityReference: "AUTH-42", consentConfirmed: true as const };
    await expect(userCaller.userWorkspace.publishAuthorizedCoordinate(payload)).rejects.toThrow("Administrator role required");
    const adminCaller = appRouter.createCaller({ ...context, user: { ...context.user, role: "admin" } });
    dbMocks.publishAuthorizedCoordinate.mockResolvedValue({ id: 1, projectId: "P-0004", active: true });
    await expect(adminCaller.userWorkspace.publishAuthorizedCoordinate(payload)).resolves.toEqual({ id: 1, projectId: "P-0004", active: true });
    expect(dbMocks.publishAuthorizedCoordinate).toHaveBeenCalledWith(expect.objectContaining({ latitude: "19.076000", longitude: "72.878000" }), 42);
    expect(dbMocks.addAuditEvent).toHaveBeenCalledWith(42, "authorised_coordinate_published", "authorized_coordinate", "P-0004", expect.stringContaining("AUTH-42"));
  });

  it("returns only active authorised coordinates to any signed-in operational workspace", async () => {
    const active = [{ id: 1, projectId: "P-0004", active: true, latitude: "19.076000", longitude: "72.878000" }];
    dbMocks.listActiveAuthorizedCoordinates.mockResolvedValue(active);
    const caller = appRouter.createCaller(context);
    await expect(caller.userWorkspace.activeAuthorizedCoordinates()).resolves.toEqual(active);
  });

  it("accepts only consent-confirmed coordinate rows in an acknowledged administrator batch", async () => {
    const adminCaller = appRouter.createCaller({ ...context, user: { ...context.user, role: "admin" } });
    dbMocks.publishAuthorizedCoordinate.mockResolvedValue({ id: 1, active: true });
    const result = await adminCaller.userWorkspace.publishAuthorizedCoordinateBatch({ rows: [{ projectId: "P-0004", latitude: 19.076, longitude: 72.878, precision: "project", sourceName: "Authorised register", authorityReference: "AUTH-42", consentConfirmed: true }] });
    expect(result).toEqual({ published: 1, requested: 1 });
    expect(dbMocks.addAuditEvent).toHaveBeenCalledWith(42, "authorised_coordinate_batch_published", "authorized_coordinate", null, expect.stringContaining("1"));
  });

  it("generates an evidence-bounded archived brief only after governed-use acknowledgement", async () => {
    dbMocks.createPortfolioBrief.mockImplementation(async (input: Record<string, unknown>) => ({ ...input, status: "generated" }));
    const caller = appRouter.createCaller(context);
    const result = await caller.briefs.generate({ projectId: "P-0004" });
    expect(result.title).toContain("risk review brief");
    expect(result.content).toContain("Synthetic Demonstration Dataset");
    expect(JSON.parse(result.evidenceJson)).toMatchObject({ projectId: "P-0004" });
    expect(dbMocks.addAuditEvent).toHaveBeenCalledWith(42, "portfolio_brief_generated", "portfolio_brief", expect.any(String), expect.stringContaining("P-0004"));
  });

  it("limits portfolio brief approval to an acknowledged administrator", async () => {
    const caller = appRouter.createCaller(context);
    await expect(caller.briefs.approve({ id: "BR-1" })).rejects.toThrow("Administrator role required");
    const adminCaller = appRouter.createCaller({ ...context, user: { ...context.user, role: "admin" } });
    dbMocks.approvePortfolioBrief.mockResolvedValue({ id: "BR-1", status: "approved" });
    await expect(adminCaller.briefs.approve({ id: "BR-1" })).resolves.toEqual({ id: "BR-1", status: "approved" });
    expect(dbMocks.addAuditEvent).toHaveBeenCalledWith(42, "portfolio_brief_approved", "portfolio_brief", "BR-1", expect.any(String));
  });
});
