import { boolean, decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Persistent mirror schema for authorized data imports; synthetic demonstration data is generated at runtime. */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  projectId: varchar("projectId", { length: 32 }).notNull().unique(),
  projectName: varchar("projectName", { length: 255 }).notNull(),
  ministry: varchar("ministry", { length: 255 }).notNull(),
  department: varchar("department", { length: 255 }),
  sector: varchar("sector", { length: 128 }).notNull(),
  state: varchar("state", { length: 128 }).notNull(),
  district: varchar("district", { length: 128 }),
  implementingAgency: varchar("implementingAgency", { length: 255 }),
  approvedCost: decimal("approvedCost", { precision: 18, scale: 2 }).notNull(),
  revisedCost: decimal("revisedCost", { precision: 18, scale: 2 }),
  expenditure: decimal("expenditure", { precision: 18, scale: 2 }),
  physicalProgress: decimal("physicalProgress", { precision: 5, scale: 2 }),
  financialProgress: decimal("financialProgress", { precision: 5, scale: 2 }),
  projectStatus: varchar("projectStatus", { length: 64 }),
  numberOfMilestones: int("numberOfMilestones").default(0),
  milestonesDelayed: int("milestonesDelayed").default(0),
  numberOfExtensions: int("numberOfExtensions").default(0),
  landAcquisitionStatus: varchar("landAcquisitionStatus", { length: 64 }),
  tenderStatus: varchar("tenderStatus", { length: 64 }),
  environmentalClearanceStatus: varchar("environmentalClearanceStatus", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const monthlyProjectUpdates = mysqlTable("monthlyProjectUpdates", {
  id: int("id").autoincrement().primaryKey(),
  projectId: varchar("projectId", { length: 32 }).notNull(),
  observationMonth: varchar("observationMonth", { length: 16 }).notNull(),
  physicalProgress: decimal("physicalProgress", { precision: 5, scale: 2 }),
  financialProgress: decimal("financialProgress", { precision: 5, scale: 2 }),
  monthlyExpenditure: decimal("monthlyExpenditure", { precision: 18, scale: 2 }),
  cumulativeExpenditure: decimal("cumulativeExpenditure", { precision: 18, scale: 2 }),
  plannedProgress: decimal("plannedProgress", { precision: 5, scale: 2 }),
  milestonesCompleted: int("milestonesCompleted").default(0),
  milestonesDelayed: int("milestonesDelayed").default(0),
  riskLevel: varchar("riskLevel", { length: 32 }),
  issuesReported: text("issuesReported"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const predictions = mysqlTable("predictions", {
  id: int("id").autoincrement().primaryKey(),
  projectId: varchar("projectId", { length: 32 }).notNull(),
  predictionDate: timestamp("predictionDate").defaultNow().notNull(),
  costOverrunProbability: decimal("costOverrunProbability", { precision: 5, scale: 2 }),
  predictedCostOverrunPercentage: decimal("predictedCostOverrunPercentage", { precision: 7, scale: 2 }),
  delayProbability: decimal("delayProbability", { precision: 5, scale: 2 }),
  predictedDelayMonths: decimal("predictedDelayMonths", { precision: 7, scale: 2 }),
  implementationRisk: decimal("implementationRisk", { precision: 5, scale: 2 }),
  overallRiskScore: decimal("overallRiskScore", { precision: 5, scale: 2 }),
  riskCategory: varchar("riskCategory", { length: 32 }),
  modelVersion: varchar("modelVersion", { length: 64 }).notNull(),
});

export const importFiles = mysqlTable("importFiles", {
  id: int("id").autoincrement().primaryKey(),
  originalFilename: varchar("originalFilename", { length: 255 }).notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  storageUrl: varchar("storageUrl", { length: 512 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  sizeBytes: int("sizeBytes").notNull(),
  rowsDetected: int("rowsDetected").default(0).notNull(),
  validationStatus: mysqlEnum("validationStatus", ["validated", "needs_mapping", "rejected"]).notNull(),
  columnMapping: text("columnMapping"),
  importedBy: varchar("importedBy", { length: 128 }).notNull(),
  importCompleted: boolean("importCompleted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Per-user alert delivery choices. These settings are intentionally separate from alert records. */
export const notificationPreferences = mysqlTable("notificationPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  criticalEnabled: boolean("criticalEnabled").default(true).notNull(),
  highEnabled: boolean("highEnabled").default(true).notNull(),
  digestMode: mysqlEnum("digestMode", ["instant", "daily", "weekly"]).default("daily").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Immutable user-action record for alert acknowledgement and preference changes. */
export const auditEvents = mysqlTable("auditEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  eventType: varchar("eventType", { length: 96 }).notNull(),
  targetType: varchar("targetType", { length: 96 }).notNull(),
  targetId: varchar("targetId", { length: 128 }),
  detail: text("detail"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const acceptableUseAcknowledgements = mysqlTable("acceptableUseAcknowledgements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  policyVersion: varchar("policyVersion", { length: 32 }).notNull(),
  acceptedAt: timestamp("acceptedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

export const interventionCases = mysqlTable("interventionCases", {
  id: varchar("id", { length: 64 }).primaryKey(),
  projectId: varchar("projectId", { length: 32 }).notNull(),
  status: mysqlEnum("status", ["New", "Awaiting agency", "Response received", "Under review", "Intervention approved", "Closed"]).default("New").notNull(),
  ownerUserId: int("ownerUserId"),
  dueAt: timestamp("dueAt"),
  agencyResponse: text("agencyResponse"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const interventionEvents = mysqlTable("interventionEvents", {
  id: int("id").autoincrement().primaryKey(),
  interventionId: varchar("interventionId", { length: 64 }).notNull(),
  actorUserId: int("actorUserId").notNull(),
  actorRole: varchar("actorRole", { length: 16 }).notNull(),
  action: varchar("action", { length: 96 }).notNull(),
  detail: text("detail"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const savedReviewFilters = mysqlTable("savedReviewFilters", {
  id: int("id").autoincrement().primaryKey(),
  ownerUserId: int("ownerUserId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  teamName: varchar("teamName", { length: 128 }),
  visibility: mysqlEnum("visibility", ["private", "team"]).default("private").notNull(),
  filterState: text("filterState").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const authorizedCoordinates = mysqlTable("authorizedCoordinates", {
  id: int("id").autoincrement().primaryKey(),
  projectId: varchar("projectId", { length: 32 }).notNull(),
  latitude: decimal("latitude", { precision: 9, scale: 6 }).notNull(),
  longitude: decimal("longitude", { precision: 9, scale: 6 }).notNull(),
  precision: mysqlEnum("precision", ["district", "project"]).notNull(),
  sourceName: varchar("sourceName", { length: 255 }).notNull(),
  authorityReference: varchar("authorityReference", { length: 255 }).notNull(),
  consentConfirmed: boolean("consentConfirmed").notNull(),
  active: boolean("active").default(true).notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  supersededAt: timestamp("supersededAt"),
});

/** Immutable evidence-backed brief body with a separate, accountable approval state. */
export const portfolioBriefs = mysqlTable("portfolioBriefs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  ownerUserId: int("ownerUserId").notNull(),
  projectId: varchar("projectId", { length: 32 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  evidenceJson: text("evidenceJson").notNull(),
  status: mysqlEnum("status", ["generated", "approved", "superseded"]).default("generated").notNull(),
  approvedByUserId: int("approvedByUserId"),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ImportFile = typeof importFiles.$inferSelect;
export type InsertImportFile = typeof importFiles.$inferInsert;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type AuditEvent = typeof auditEvents.$inferSelect;
export type InterventionCase = typeof interventionCases.$inferSelect;
export type InterventionEvent = typeof interventionEvents.$inferSelect;
export type PortfolioBrief = typeof portfolioBriefs.$inferSelect;
