export type WorkspaceNotification = { id: string; tone: "critical" | "high" | "info"; title: string; body: string; read: boolean };
export type WorkspaceNotificationPreferences = { criticalEnabled?: boolean; highEnabled?: boolean };

export function filterNotificationsForPreferences(items: WorkspaceNotification[], preferences?: WorkspaceNotificationPreferences) {
  return items.filter(item => item.tone === "info" || (item.tone === "critical" && preferences?.criticalEnabled !== false) || (item.tone === "high" && preferences?.highEnabled !== false));
}

export const notificationCentreRoutes = { preferences: "/profile", auditHistory: "/audit-history" } as const;

export function markNotificationsRead(items: WorkspaceNotification[]) {
  return items.map(item => ({ ...item, read: true }));
}

export function dismissWorkspaceNotification(items: WorkspaceNotification[], id: string) {
  return items.filter(item => item.id !== id);
}
