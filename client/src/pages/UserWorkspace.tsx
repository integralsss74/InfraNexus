import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";
import { BellRing, ClipboardList, History, LogIn, LogOut, Mail, Save, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

type PreferenceDraft = { criticalEnabled: boolean; highEnabled: boolean; digestMode: "instant" | "daily" | "weekly" };
const defaultPreferences: PreferenceDraft = { criticalEnabled: true, highEnabled: true, digestMode: "daily" };

function PageTitle({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return <div className="paimana-page-header mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#61738a]">{eyebrow}</p><h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#102a43] md:text-3xl">{title}</h1></div>{children}</div>;
}

function Notice() {
  return null;
}

function SignInRequired() {
  const utils = trpc.useUtils();
  const demoLogin = trpc.auth.loginDemo.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      await utils.userWorkspace.profile.invalidate();
      window.location.reload();
    },
  });

  return (
    <div>
      <PageTitle eyebrow="Account access" title="Profile & preferences" />
      <Notice />
      <div className="mx-auto max-w-xl rounded-xl border border-[#dce5ed] bg-white p-8 text-center shadow-sm">
        <UserRound className="mx-auto size-12 text-[#147b77]" />
        <h2 className="mt-4 text-xl font-semibold text-[#173b5f]">Sign in to manage your workspace</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#62788d]">
          Your profile, alert delivery preferences, and review audit history are available after sign-in.
        </p>

        {demoLogin.isError ? (
          <div role="alert" className="mt-4 rounded-lg bg-[#fff1f0] border border-[#ffccc7] p-3 text-xs text-[#cf1322]">
            {demoLogin.error.message || "Failed to sign in. Please try again."}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            type="button"
            className="bg-[#147b77] hover:bg-[#0e6763] text-white cursor-pointer"
            disabled={demoLogin.isPending}
            onClick={() => demoLogin.mutate({ role: "admin", name: "MoSPI Administrator" })}
          >
            <ShieldCheck className="mr-2 size-4" />
            {demoLogin.isPending ? "Signing in..." : "Sign in as Administrator"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="border-[#147b77] text-[#147b77] hover:bg-[#eaf4f0] cursor-pointer"
            disabled={demoLogin.isPending}
            onClick={() => demoLogin.mutate({ role: "analyst", name: "Senior Risk Analyst" })}
          >
            <UserRound className="mr-2 size-4" />
            Sign in as Analyst
          </Button>
        </div>

        <div className="mt-5 border-t border-[#e2e8f0] pt-4">
          <button
            type="button"
            onClick={() => startLogin()}
            className="inline-flex items-center text-xs font-semibold text-[#5a7184] hover:text-[#147b77] cursor-pointer"
          >
            <LogIn className="mr-1.5 size-3.5" />
            Sign in via OAuth Portal
          </button>
        </div>
      </div>
    </div>
  );
}

function PreferenceControls() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const preferences = trpc.userWorkspace.notificationPreferences.useQuery(undefined, { enabled: isAuthenticated });
  const [draft, setDraft] = useState<PreferenceDraft>(defaultPreferences);
  useEffect(() => { if (preferences.data) setDraft(preferences.data); }, [preferences.data]);
  const save = trpc.userWorkspace.saveNotificationPreferences.useMutation({ onSuccess: () => { utils.userWorkspace.notificationPreferences.invalidate(); utils.userWorkspace.profile.invalidate(); utils.userWorkspace.auditHistory.invalidate(); } });
  return <section className="rounded-xl border border-[#dce4ed] bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><h2 className="text-sm font-semibold text-[#173b5f]">Alert delivery preferences</h2><p className="mt-1 text-xs leading-5 text-[#718196]">Select which synthetic analytical signals should appear in your workspace notification centre.</p></div><BellRing className="size-5 text-[#3e719c]" /></div><div className="mt-5 space-y-4"><div className="flex items-center justify-between rounded-lg bg-[#f7fafc] p-3"><div><Label htmlFor="critical-alerts" className="text-xs font-semibold text-[#345673]">Critical-risk signals</Label><p className="mt-1 text-[11px] text-[#708297]">Delivery for critical synthetic early warnings.</p></div><Switch id="critical-alerts" checked={draft.criticalEnabled} onCheckedChange={checked => setDraft(current => ({ ...current, criticalEnabled: checked }))} /></div><div className="flex items-center justify-between rounded-lg bg-[#f7fafc] p-3"><div><Label htmlFor="high-alerts" className="text-xs font-semibold text-[#345673]">High-risk signals</Label><p className="mt-1 text-[11px] text-[#708297]">Delivery for high-priority analytical signals.</p></div><Switch id="high-alerts" checked={draft.highEnabled} onCheckedChange={checked => setDraft(current => ({ ...current, highEnabled: checked }))} /></div><div><Label className="mb-2 block text-xs font-semibold text-[#345673]">Digest cadence</Label><Select value={draft.digestMode} onValueChange={value => setDraft(current => ({ ...current, digestMode: value as PreferenceDraft["digestMode"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="instant">Instant review feed</SelectItem><SelectItem value="daily">Daily digest</SelectItem><SelectItem value="weekly">Weekly digest</SelectItem></SelectContent></Select></div></div><Button className="mt-5 bg-[#143b62] hover:bg-[#0f3153]" disabled={save.isPending} onClick={() => save.mutate(draft)}><Save className="mr-2 size-3.5" />{save.isPending ? "Saving…" : "Save preferences"}</Button></section>;
}

export function UserProfilePage() {
  const { user, loading, isAuthenticated } = useAuth();
  const profile = trpc.userWorkspace.profile.useQuery(undefined, { enabled: isAuthenticated });
  const logout = trpc.auth.logout.useMutation({ onSuccess: () => window.location.assign("/") });
  if (loading) return <div className="grid min-h-[50vh] place-items-center text-sm text-[#6e8092]">Loading account details…</div>;
  if (!user) return <SignInRequired />;
  return <div><PageTitle eyebrow="Signed-in workspace" title="Profile & notification preferences" /><Notice />{profile.isError ? <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e5c8c4] bg-[#fff7f5] px-4 py-3 text-xs text-[#8b4b45]">The persisted account profile could not be retrieved; identity details below remain supplied by managed authentication. <button onClick={() => profile.refetch()} className="font-semibold underline">Retry profile record</button></div> : null}<div className="grid gap-4 xl:grid-cols-12"><section className="rounded-xl border border-[#dce4ed] bg-white p-5 shadow-sm xl:col-span-5"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-4"><span className="grid size-14 place-items-center rounded-2xl bg-[#eaf3fb] text-[#265f90]"><UserRound className="size-7" /></span><div><h2 className="text-lg font-semibold text-[#173b5f]">{user.name ?? "InfraNexus user"}</h2><p className="mt-1 flex items-center gap-1.5 text-xs text-[#708296]"><Mail className="size-3.5" />{user.email ?? "No email shared"}</p></div></div><Button variant="outline" size="sm" className="border-[#dfc4c0] text-[#91463f] hover:bg-[#fff5f3] hover:text-[#7d3a35]" disabled={logout.isPending} onClick={() => logout.mutate()}><LogOut className="mr-1.5 size-3.5" />{logout.isPending ? "Signing out…" : "Sign out"}</Button></div><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-lg bg-[#f6f9fc] p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-[#7b8d9f]">Access role</p><Badge variant="outline" className="mt-2 border-[#c6dced] bg-white text-[#2b638f]">{user.role}</Badge></div><div className="rounded-lg bg-[#f6f9fc] p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-[#7b8d9f]">Sign-in method</p><p className="mt-2 text-xs font-semibold text-[#345673]">{user.loginMethod ?? "Managed OAuth"}</p></div><div className="rounded-lg bg-[#f6f9fc] p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-[#7b8d9f]">Account created</p><p className="mt-2 text-xs font-semibold text-[#345673]">{new Date(user.createdAt).toLocaleDateString()}</p></div><div className="rounded-lg bg-[#f6f9fc] p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-[#7b8d9f]">Profile updated</p><p className="mt-2 text-xs font-semibold text-[#345673]">{new Date(user.updatedAt).toLocaleString()}</p></div><div className="col-span-2 rounded-lg bg-[#f6f9fc] p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-[#7b8d9f]">Last sign-in</p><p className="mt-2 text-xs font-semibold text-[#345673]">{new Date(user.lastSignedIn).toLocaleString()}</p></div></div>{logout.isError ? <p role="alert" className="mt-3 text-xs text-[#a34843]">{logout.error.message || "Unable to sign out securely. Please try again."}</p> : null}<div className="mt-5 rounded-lg border border-[#dfe9f1] p-3 text-xs leading-5 text-[#5d7389]"><ShieldCheck className="mr-2 inline size-4 text-emerald-600" />Preferences are {profile.data?.persisted ? "persisted for this account" : "ready to be saved for this account"}. Activity appears in your audit history after an acknowledgement or preference update.</div></section><div className="xl:col-span-7"><PreferenceControls /></div></div></div>;
}

export function AuditHistoryPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const history = trpc.userWorkspace.auditHistory.useQuery({ limit: 100 }, { enabled: isAuthenticated });
  if (loading) return <div className="grid min-h-[50vh] place-items-center text-sm text-[#6e8092]">Loading audit history…</div>;
  if (!user) return <SignInRequired />;
  return <div><PageTitle eyebrow="Accountability record" title="Audit history" /><Notice /><section className="rounded-xl border border-[#dce4ed] bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-[#edf4fa] text-[#3c6f98]"><History className="size-4" /></span><div><h2 className="text-sm font-semibold text-[#173b5f]">Workspace activity</h2><p className="mt-1 text-xs text-[#718196]">Preference updates and synthetic-alert acknowledgements attributable to your signed-in account.</p></div></div><div className="mt-5 divide-y divide-[#e8eef3]">{history.data?.length ? history.data.map(event => <div key={event.id} className="flex gap-3 py-4 first:pt-0"><ClipboardList className="mt-0.5 size-4 shrink-0 text-[#4e7ca3]" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-semibold text-[#315675]">{event.eventType.replaceAll("_", " ")}</p><Badge variant="outline" className="text-[9px]">{event.targetType}</Badge>{event.targetId ? <span className="text-[10px] text-[#7890a3]">{event.targetId}</span> : null}</div><p className="mt-1 text-[11px] leading-5 text-[#64798e]">{event.detail ?? "No additional detail recorded."}</p></div><time className="shrink-0 text-[10px] text-[#7b8d9e]">{new Date(event.createdAt).toLocaleString()}</time></div>) : <div className="grid min-h-48 place-items-center text-center"><div><ClipboardList className="mx-auto size-8 text-[#92aac0]" /><p className="mt-3 text-sm font-medium text-[#4c6880]">No recorded workspace activity yet</p><p className="mt-1 text-xs text-[#77899a]">Saving preferences or acknowledging a synthetic alert will add an entry here.</p></div></div>}</div></section></div>;
}
