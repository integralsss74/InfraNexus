import { describe, expect, it } from "vitest";
import { dismissWorkspaceNotification, filterNotificationsForPreferences, markNotificationsRead, notificationCentreRoutes } from "./notificationPreferences";

const notifications = [
  { id: "critical", tone: "critical" as const, title: "Critical", body: "", read: false },
  { id: "high", tone: "high" as const, title: "High", body: "", read: false },
  { id: "info", tone: "info" as const, title: "Info", body: "", read: true },
];

describe("notification preference filtering", () => {
  it("keeps all items when no preferences have been saved", () => {
    expect(filterNotificationsForPreferences(notifications)).toHaveLength(3);
  });

  it("suppresses only the disabled alert tiers while retaining runtime information", () => {
    expect(filterNotificationsForPreferences(notifications, { criticalEnabled: false, highEnabled: true }).map(item => item.id)).toEqual(["high", "info"]);
    expect(filterNotificationsForPreferences(notifications, { criticalEnabled: false, highEnabled: false }).map(item => item.id)).toEqual(["info"]);
  });

  it("marks visible items as read, dismisses an item, and exposes the account destinations", () => {
    expect(markNotificationsRead(notifications).every(item => item.read)).toBe(true);
    expect(dismissWorkspaceNotification(notifications, "high").map(item => item.id)).toEqual(["critical", "info"]);
    expect(notificationCentreRoutes).toEqual({ preferences: "/profile", auditHistory: "/audit-history" });
  });
});
