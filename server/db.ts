import { and, desc, eq, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { AuditEvent, ImportFile, InsertImportFile, InsertUser, NotificationPreferences, acceptableUseAcknowledgements, auditEvents, authorizedCoordinates, importFiles, interventionCases, interventionEvents, notificationPreferences, portfolioBriefs, savedReviewFilters, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

const inMemoryUsers = new Map<string, User>();

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const now = new Date();
  const existing = inMemoryUsers.get(user.openId);
  const memUser: User = {
    id: existing?.id ?? Math.floor(Math.random() * 10000) + 1,
    openId: user.openId,
    name: user.name ?? existing?.name ?? null,
    email: user.email ?? existing?.email ?? null,
    loginMethod: user.loginMethod ?? existing?.loginMethod ?? null,
    role: (user.role as "admin" | "user") ?? existing?.role ?? "admin",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    lastSignedIn: user.lastSignedIn ?? now,
  };
  inMemoryUsers.set(user.openId, memUser);

  const db = await getDb();
  if (!db) {
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    return inMemoryUsers.get(openId);
  }

  try {
    const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    return result.length > 0 ? result[0] : inMemoryUsers.get(openId);
  } catch {
    return inMemoryUsers.get(openId);
  }
}

export async function createImportFile(record: InsertImportFile): Promise<ImportFile | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(importFiles).values(record).$returningId();
  const id = result[0]?.id;
  if (!id) return null;
  const created = await db.select().from(importFiles).where(eq(importFiles.id, id)).limit(1);
  return created[0] ?? null;
}

export async function listImportFiles(): Promise<ImportFile[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(importFiles).orderBy(importFiles.createdAt);
}

export type NotificationPreferenceInput = { criticalEnabled: boolean; highEnabled: boolean; digestMode: "instant" | "daily" | "weekly" };

export async function getNotificationPreferences(userId: number): Promise<NotificationPreferences | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function saveNotificationPreferences(userId: number, input: NotificationPreferenceInput): Promise<NotificationPreferences | null> {
  const db = await getDb();
  if (!db) return null;
  await db.insert(notificationPreferences).values({ userId, ...input }).onDuplicateKeyUpdate({ set: input });
  return getNotificationPreferences(userId);
}

const inMemoryAuditEvents = new Map<number, AuditEvent[]>();

export async function addAuditEvent(userId: number, eventType: string, targetType: string, targetId?: string | null, detail?: string | null): Promise<void> {
  const event: AuditEvent = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    userId,
    eventType,
    targetType,
    targetId: targetId ?? null,
    detail: detail ?? null,
    createdAt: new Date(),
  };
  const list = inMemoryAuditEvents.get(userId) ?? [];
  list.unshift(event);
  inMemoryAuditEvents.set(userId, list);

  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(auditEvents).values({ userId, eventType, targetType, targetId: targetId ?? null, detail: detail ?? null });
  } catch (err) {
    console.warn("[Database] addAuditEvent warning:", err);
  }
}

export async function listAuditEvents(userId: number, limit = 80): Promise<AuditEvent[]> {
  const db = await getDb();
  if (!db) return inMemoryAuditEvents.get(userId) ?? [];
  try {
    const rows = await db.select().from(auditEvents).where(eq(auditEvents.userId, userId)).orderBy(desc(auditEvents.createdAt)).limit(Math.min(200, Math.max(1, limit)));
    return rows.length ? rows : (inMemoryAuditEvents.get(userId) ?? []);
  } catch {
    return inMemoryAuditEvents.get(userId) ?? [];
  }
}

const inMemoryAcceptedPolicies = new Map<number, string>();

export async function hasAcceptedUsePolicy(userId: number, policyVersion: string) {
  const db = await getDb();
  if (!db) return inMemoryAcceptedPolicies.get(userId) === policyVersion;
  try {
    const rows = await db.select().from(acceptableUseAcknowledgements).where(eq(acceptableUseAcknowledgements.userId, userId)).limit(1);
    return rows[0]?.policyVersion === policyVersion || inMemoryAcceptedPolicies.get(userId) === policyVersion;
  } catch {
    return inMemoryAcceptedPolicies.get(userId) === policyVersion;
  }
}

export async function acceptUsePolicy(userId: number, policyVersion: string) {
  inMemoryAcceptedPolicies.set(userId, policyVersion);
  const db = await getDb();
  if (!db) return { accepted: true, policyVersion };
  try {
    await db.insert(acceptableUseAcknowledgements).values({ userId, policyVersion }).onDuplicateKeyUpdate({ set: { policyVersion, acceptedAt: new Date(), completedAt: new Date() } });
  } catch (err) {
    console.warn("[Database] acceptUsePolicy warning:", err);
  }
  return { accepted: true, policyVersion };
}

export type InterventionStatus = "New" | "Awaiting agency" | "Response received" | "Under review" | "Intervention approved" | "Closed";

export async function listInterventionCases(userId: number, isAdmin: boolean) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(interventionCases).where(isAdmin ? undefined : eq(interventionCases.ownerUserId, userId)).orderBy(desc(interventionCases.updatedAt));
}

export async function createInterventionCase(input: { id: string; projectId: string; ownerUserId?: number | null; dueAt?: Date | null }, actor: { id: number; role: string }) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(interventionCases).values({ id: input.id, projectId: input.projectId, ownerUserId: input.ownerUserId ?? null, dueAt: input.dueAt ?? null });
  await db.insert(interventionEvents).values({ interventionId: input.id, actorUserId: actor.id, actorRole: actor.role, action: "created", detail: `Project ${input.projectId} entered the governed review workflow.` });
  return (await db.select().from(interventionCases).where(eq(interventionCases.id, input.id)).limit(1))[0] ?? null;
}

export async function transitionInterventionCase(id: string, status: InterventionStatus, actor: { id: number; role: string }) {
  const db = await getDb();
  if (!db) return null;
  await db.update(interventionCases).set({ status, updatedAt: new Date() }).where(eq(interventionCases.id, id));
  await db.insert(interventionEvents).values({ interventionId: id, actorUserId: actor.id, actorRole: actor.role, action: "status_changed", detail: `Status changed to ${status}.` });
  return (await db.select().from(interventionCases).where(eq(interventionCases.id, id)).limit(1))[0] ?? null;
}

export async function submitInterventionResponse(id: string, agencyResponse: string, actor: { id: number; role: string }) {
  const db = await getDb();
  if (!db) return null;
  const current = (await db.select().from(interventionCases).where(eq(interventionCases.id, id)).limit(1))[0];
  if (!current) throw new Error("Intervention review not found.");
  if (actor.role !== "admin" && current.ownerUserId !== actor.id) throw new Error("Only the assigned owner or an administrator can submit a review response.");
  await db.update(interventionCases).set({ agencyResponse, status: "Response received", updatedAt: new Date() }).where(eq(interventionCases.id, id));
  await db.insert(interventionEvents).values({ interventionId: id, actorUserId: actor.id, actorRole: actor.role, action: "agency_response_submitted", detail: agencyResponse });
  return (await db.select().from(interventionCases).where(eq(interventionCases.id, id)).limit(1))[0] ?? null;
}

export async function listInterventionEvents(interventionId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(interventionEvents).where(eq(interventionEvents.interventionId, interventionId)).orderBy(interventionEvents.createdAt);
}

export async function saveReviewFilter(input: { ownerUserId: number; name: string; teamName?: string | null; visibility: "private" | "team"; filterState: string }) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(savedReviewFilters).values(input).$returningId();
  return result[0]?.id ?? null;
}

export async function listReviewFilters(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(savedReviewFilters).where(or(eq(savedReviewFilters.ownerUserId, userId), eq(savedReviewFilters.visibility, "team"))).orderBy(desc(savedReviewFilters.updatedAt));
}

export async function listAuthorizedCoordinates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(authorizedCoordinates).orderBy(desc(authorizedCoordinates.createdAt));
}

export async function listActiveAuthorizedCoordinates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(authorizedCoordinates).where(eq(authorizedCoordinates.active, true)).orderBy(desc(authorizedCoordinates.createdAt));
}

export async function publishAuthorizedCoordinate(input: { projectId: string; latitude: string; longitude: string; precision: "district" | "project"; sourceName: string; authorityReference: string }, actorUserId: number) {
  const db = await getDb();
  if (!db) return null;
  await db.update(authorizedCoordinates).set({ active: false, supersededAt: new Date() }).where(eq(authorizedCoordinates.projectId, input.projectId));
  const inserted = await db.insert(authorizedCoordinates).values({ ...input, consentConfirmed: true, active: true, createdByUserId: actorUserId }).$returningId();
  return (await db.select().from(authorizedCoordinates).where(eq(authorizedCoordinates.id, inserted[0]?.id ?? -1)).limit(1))[0] ?? null;
}

export async function createPortfolioBrief(input: { id: string; ownerUserId: number; projectId: string; title: string; content: string; evidenceJson: string }) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(portfolioBriefs).values({ ...input, status: "generated" });
  return (await db.select().from(portfolioBriefs).where(eq(portfolioBriefs.id, input.id)).limit(1))[0] ?? null;
}

export async function listPortfolioBriefs(ownerUserId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(portfolioBriefs).where(eq(portfolioBriefs.ownerUserId, ownerUserId)).orderBy(desc(portfolioBriefs.updatedAt));
}

export async function approvePortfolioBrief(id: string, ownerUserId: number, approverUserId: number) {
  const db = await getDb();
  if (!db) return null;
  await db.update(portfolioBriefs).set({ status: "approved", approvedByUserId: approverUserId, approvedAt: new Date() }).where(and(eq(portfolioBriefs.id, id), eq(portfolioBriefs.ownerUserId, ownerUserId)));
  return (await db.select().from(portfolioBriefs).where(eq(portfolioBriefs.id, id)).limit(1))[0] ?? null;
}
