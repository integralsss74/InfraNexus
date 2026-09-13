import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { dismissWorkspaceNotification, filterNotificationsForPreferences, markNotificationsRead, notificationCentreRoutes, WorkspaceNotification } from "@/lib/notificationPreferences";
import { useWorkingPersonas } from "@/lib/workingPersonas";
import { AlertTriangle, BarChart3, BellRing, Bot, BrainCircuit, ClipboardList, Command, Database, FileCheck2, Gauge, Landmark, LayoutDashboard, Map, Presentation, ShieldCheck, SlidersHorizontal, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

const primaryItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" }, { icon: Map, label: "Project Explorer", path: "/explorer" }, { icon: Gauge, label: "Risk Monitor", path: "/risk-monitor" }, { icon: BellRing, label: "Early Warnings", path: "/alerts" }, { icon: BarChart3, label: "Analytics", path: "/analytics" }, { icon: Landmark, label: "Benchmarking", path: "/benchmarking" }, { icon: BrainCircuit, label: "Cost Drivers", path: "/cost-drivers" }, { icon: SlidersHorizontal, label: "What-If Simulator", path: "/simulator" },
];
const governanceItems = [
  { icon: Bot, label: "AI Assistant", path: "/assistant" }, { icon: ClipboardList, label: "Review workflow", path: "/reviews" }, { icon: SlidersHorizontal, label: "Workflow setup", path: "/workflow-settings" }, { icon: Database, label: "Data Management", path: "/data-management" }, { icon: FileCheck2, label: "Data Quality", path: "/data-quality" }, { icon: BarChart3, label: "Model Performance", path: "/model-performance" }, { icon: ShieldCheck, label: "Documentation", path: "/documentation" }, { icon: UserRound, label: "Profile & Preferences", path: "/profile" }, { icon: ClipboardList, label: "Audit History", path: "/audit-history" },
];
const initialNotifications: WorkspaceNotification[] = [
  { id: "critical-review", tone: "critical", title: "Critical review available", body: "Synthetic demo signals remain available in Early Warnings.", read: false },
  { id: "high-review", tone: "high", title: "High-priority review available", body: "High-risk synthetic signals can be reviewed in Early Warnings.", read: false },
  { id: "model-runtime", tone: "info", title: "Model runtime", body: "Managed fallback is active until a local FastAPI sidecar URL is configured.", read: false },
];

function AcceptableUseGate() {
  const { isAuthenticated } = useAuth();
  const [consent, setConsent] = useState(false);
  const acknowledgement = trpc.userWorkspace.acceptableUse.useQuery(undefined, { enabled: isAuthenticated });
  const accept = trpc.userWorkspace.acceptAcceptableUse.useMutation({ onSuccess: () => { setConsent(false); void acknowledgement.refetch(); } });

  if (!isAuthenticated || acknowledgement.data?.accepted) return null;
  const policyVersion = acknowledgement.data?.policyVersion ?? "2026-08";
  const unavailable = acknowledgement.isError;

  return <Dialog open onOpenChange={() => undefined}>
    <DialogContent showCloseButton={false} onEscapeKeyDown={event => event.preventDefault()} onPointerDownOutside={event => event.preventDefault()} className="border-[#c8ddd8] bg-[#f9fbf8] p-0 text-[#183842] sm:max-w-xl">
      <DialogHeader className="border-b border-[#d9e7e2] bg-[linear-gradient(135deg,#e5f2ee,#f9fbf8)] p-6 pb-5 text-left">
        <div className="mb-3 grid size-10 place-items-center rounded-xl bg-[#147b77] text-white"><ShieldCheck className="size-5" /></div>
        <DialogTitle className="font-serif text-2xl tracking-[-0.03em] text-[#183842]">Governed use acknowledgement</DialogTitle>
        <DialogDescription className="mt-2 max-w-lg text-left leading-6 text-[#587078]">Before opening the authenticated command desk, confirm the policy that governs synthetic or authorised evidence, analytical outputs, and human review.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 px-6 py-5">
        {acknowledgement.isLoading ? <div role="status" className="rounded-lg border border-[#d7e3df] bg-white p-4 text-sm text-[#5f757b]">Checking your persisted policy acknowledgement…</div> : unavailable ? <div role="alert" className="rounded-lg border border-[#e5caca] bg-[#fff7f6] p-4 text-sm leading-6 text-[#874a45]"><strong>We could not confirm your governed-use status.</strong><br />{acknowledgement.error?.message ?? "Please retry before continuing to operational routes."}</div> : <><div className="rounded-lg border border-[#d9e8e3] bg-white p-4 text-sm leading-6 text-[#4e6870]"><p className="font-semibold text-[#1b4b50]">Policy version {policyVersion}</p><p className="mt-1">I understand that this workspace uses a synthetic demonstration dataset unless an authorised source is connected; predictions and recommendations are analytical aids, not official decisions; and any intervention requires accountable human review and recorded evidence.</p></div><label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#cbded8] bg-[#f2f8f5] p-4 text-sm leading-6 text-[#2e5557]"><Checkbox checked={consent} onCheckedChange={value => setConsent(value === true)} aria-label="I acknowledge the governed use policy" className="mt-1 border-[#498c85]" /><span>I have read and accept the governed-use policy for this authenticated workspace.</span></label>{accept.isError ? <p role="alert" className="text-xs text-[#a34843]">{accept.error.message || "The acknowledgement could not be saved. Please retry."}</p> : null}</>}
      </div>
      <DialogFooter className="border-t border-[#d9e7e2] bg-white px-6 py-4 sm:justify-between"><p className="text-[10px] leading-4 text-[#71868a]">A successful acknowledgement is timestamped in your audit history.</p>{unavailable ? <Button variant="outline" onClick={() => acknowledgement.refetch()}>Retry status check</Button> : <Button disabled={acknowledgement.isLoading || !consent || accept.isPending} onClick={() => accept.mutate()} className="bg-[#147b77] hover:bg-[#0e6763]">{accept.isPending ? "Saving acknowledgement…" : "Acknowledge and continue"}</Button>}</DialogFooter>
    </DialogContent>
  </Dialog>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <SidebarProvider><DashboardLayoutContent>{children}</DashboardLayoutContent></SidebarProvider>;
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [commandOpen, setCommandOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<WorkspaceNotification[]>(initialNotifications);
  const { isMobile, setOpenMobile } = useSidebar();
  const { isAuthenticated } = useAuth();
  const { personas, active: activePersona, setActive: setActivePersona } = useWorkingPersonas();
  const preferences = trpc.userWorkspace.notificationPreferences.useQuery(undefined, { enabled: isAuthenticated });
  const operationalAliases: Record<string, string> = { "/portfolio": "/dashboard", "/register": "/explorer", "/intelligence": "/briefs", "/warnings": "/alerts", "/signals": "/context-signals", "/evidence": "/model-evidence", "/import": "/data-management", "/quality": "/data-quality", "/account": "/profile" };
  const activeLocation = operationalAliases[location] ?? location;
  const activeMenuItem = [...primaryItems, ...governanceItems].find(item => activeLocation === item.path || (activeLocation.startsWith("/projects/") && item.path === "/explorer"));
  const visibleNotifications = filterNotificationsForPreferences(notifications, preferences.data);
  const unreadCount = visibleNotifications.filter(notification => !notification.read).length;
  const go = (path: string) => { setLocation(path); setCommandOpen(false); if (isMobile) setOpenMobile(false); };
  const toggleNotifications = () => { setNotificationsOpen(open => !open); setNotifications(markNotificationsRead); };
  const dismissNotification = (id: string) => setNotifications(items => dismissWorkspaceNotification(items, id));

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCommandOpen(open => !open); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    setNotificationsOpen(new URLSearchParams(window.location.search).get("notifications") === "open");
  }, [location]);

  useEffect(() => {
    if (isMobile && new URLSearchParams(window.location.search).get("nav") === "open") setOpenMobile(true);
  }, [isMobile, location, setOpenMobile]);

  if (location === "/presentation") return <main className="min-h-screen bg-[#eef3f8] p-3 sm:p-6">{children}</main>;

  return <>
    <a href="#workspace-content" className="sr-only fixed left-4 top-3 z-[100] rounded-md bg-[#147b77] px-4 py-2 text-sm font-semibold text-white shadow-lg focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-white">Skip to workspace content</a>
    <Sidebar collapsible="icon" className="paimana-sidebar border-r border-[#0f2234] bg-[#17283a] text-[#dbe8eb]">
      <SidebarHeader className="h-[84px] border-b border-white/10 px-3"><div className="flex items-center gap-3"><span role="img" aria-label="InfraNexus civic infrastructure mark" className="paimana-brand-mark relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#8fd3d0]/35 bg-[linear-gradient(145deg,#1e6d78,#123a60_58%,#102a43)] text-white shadow-[0_8px_18px_rgba(2,12,24,.34)]" style={{ paddingRight: "1.5px" }}><Landmark className="relative z-10 size-5" strokeWidth={1.9} /><span aria-hidden className="absolute inset-x-1.5 bottom-1.5 h-px bg-[#a9ece1]/80" /><span aria-hidden className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-[#76d7c6] shadow-[0_0_0_3px_rgba(118,215,198,.14)]" /></span><div className="min-w-0 group-data-[collapsible=icon]:hidden"><p className="text-sm font-extrabold tracking-[-0.04em] text-white">InfraNexus</p><p className="text-[9px] font-semibold uppercase tracking-[0.17em] text-[#a8c7c4]">Infra risk predictor</p></div></div></SidebarHeader>
      <SidebarContent className="px-2 py-4"><div className="mb-4 px-2 group-data-[collapsible=icon]:hidden"><p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#a8c7c4]">Command desk</p><label htmlFor="working-persona" className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#94b5b3]">Working persona</label><select id="working-persona" value={activePersona.id} onChange={(event) => setActivePersona(event.target.value)} className="mt-1 w-full rounded-md border border-[#40616d] bg-[#20394b] px-2 py-1.5 text-[10px] font-medium text-[#e1efee] outline-none focus:ring-2 focus:ring-[#4fc0b3]"><option value={activePersona.id}>{activePersona.name}</option>{personas.filter((persona) => persona.id !== activePersona.id).map((persona) => <option key={persona.id} value={persona.id}>{persona.name}</option>)}</select><p className="mt-1 text-[9px] leading-3 text-[#9bb7b5]">Local simulation only</p></div><p className="mb-2 px-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#a8c7c4] group-data-[collapsible=icon]:hidden">Portfolio</p><SidebarMenu>{primaryItems.map(item => <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={activeMenuItem?.path === item.path} onClick={() => go(item.path)} tooltip={item.label} className="h-8 text-[#c6d5d7] data-[active=true]:border-l-2 data-[active=true]:border-[#4fc0b3] data-[active=true]:bg-[linear-gradient(90deg,rgba(20,123,119,.55),rgba(20,123,119,.14))] data-[active=true]:font-semibold data-[active=true]:text-white"><item.icon className="size-4" /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu><SidebarMenu className="mt-4">{governanceItems.map(item => <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={activeMenuItem?.path === item.path} onClick={() => go(item.path)} tooltip={item.label} className="h-8 text-[#c6d5d7] data-[active=true]:border-l-2 data-[active=true]:border-[#4fc0b3] data-[active=true]:bg-[linear-gradient(90deg,rgba(20,123,119,.55),rgba(20,123,119,.14))] data-[active=true]:font-semibold data-[active=true]:text-white"><item.icon className="size-4" /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarContent>
      <SidebarFooter className="p-3" />
    </Sidebar>
    <SidebarInset>
      <header className="paimana-header sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-[#d8e2de] bg-[#f8faf7]/95 px-4 backdrop-blur md:px-7"><div className="flex items-center gap-3"><SidebarTrigger className="size-9 rounded-lg border border-[#d8e2de] bg-white text-[#147b77]" /><div><p className="text-xs font-semibold text-[#17283a]">{activeMenuItem?.label ?? "InfraNexus"}</p><p className="text-[10px] text-[#69787f]">MoSPI Infrastructure & Project Monitoring</p></div></div><div className="flex items-center gap-2"><div className="hidden items-center gap-2 rounded-full border border-[#cae1da] bg-[#eaf4f0] px-3 py-1.5 text-[11px] font-medium text-[#276c67] xl:flex"><span className="size-1.5 rounded-full bg-[#147b77]" />Data engine operational</div><Button variant="outline" size="sm" className="hidden h-8 border-[#d8e2de] text-xs text-[#245b5a] lg:flex" onClick={() => go("/presentation")}><Presentation className="mr-1.5 size-3.5" />Present</Button><Button variant="outline" size="icon" className="size-8 border-[#d8e2de] text-[#245b5a]" aria-label="Open command palette" onClick={() => setCommandOpen(true)}><Command className="size-3.5" /></Button><div className="relative"><Button variant="outline" size="icon" className="size-8 border-[#d8e2de] text-[#245b5a]" aria-label="Open notification center" onClick={toggleNotifications}><BellRing className="size-3.5" />{unreadCount ? <span className="absolute right-1 top-1 grid size-3 min-w-3 place-items-center rounded-full bg-[#c85035] text-[7px] font-bold text-white">{unreadCount}</span> : null}</Button>{notificationsOpen ? <div role="dialog" aria-label="Notification centre" className="paimana-notification absolute right-0 top-10 z-50 w-80 rounded-xl border border-[#d8e2de] bg-white p-3 shadow-xl"><div className="mb-2 flex items-center justify-between"><p className="text-xs font-semibold text-[#17283a]">Notification centre</p><div className="flex items-center gap-2"><button className="text-[10px] font-semibold text-[#147b77] disabled:opacity-40" disabled={!visibleNotifications.length} onClick={() => setNotifications([])}>Clear all</button><button className="text-[10px] font-semibold text-[#147b77]" onClick={() => setNotificationsOpen(false)}>Close</button></div></div>{visibleNotifications.length ? <div className="space-y-2">{visibleNotifications.map(notification => <div key={notification.id} className={`group relative rounded-lg p-2.5 pr-7 text-[11px] ${notification.tone === "critical" ? "bg-[#fdf1ee] text-[#854434]" : notification.tone === "high" ? "bg-[#fff7e8] text-[#81561f]" : "bg-[#eaf4f0] text-[#356c68]"}`}><b>{notification.title}:</b> {notification.body}<button aria-label={`Dismiss ${notification.title}`} className="absolute right-1.5 top-1.5 rounded p-1 opacity-60 hover:bg-white hover:opacity-100" onClick={() => dismissNotification(notification.id)}><X className="size-3" /></button></div>)}</div> : <p className="rounded-lg bg-[#f2f5f3] p-3 text-center text-[11px] text-[#69787f]">No active notifications under your current preferences.</p>}<div className="mt-3 flex justify-between border-t border-[#e4ebe7] pt-2"><button className="text-[10px] font-semibold text-[#147b77]" onClick={() => go(notificationCentreRoutes.preferences)}>Manage preferences</button><button className="text-[10px] font-semibold text-[#147b77]" onClick={() => go(notificationCentreRoutes.auditHistory)}>View audit history</button></div><p className="mt-2 text-[9px] leading-3 text-[#7a8c84]">Opening marks visible items read. Preference changes are retained for the signed-in workspace.</p></div> : null}</div></div></header>
      <main id="workspace-content" tabIndex={-1} className="paimana-app-main min-h-[calc(100vh-72px)] bg-[#f5f7fa] p-4 outline-none md:p-6">{children}</main>
    </SidebarInset>
    <AcceptableUseGate />
    <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}><CommandInput placeholder="Search actions, pages, and portfolio views…" /><CommandList><CommandEmpty>No matching command.</CommandEmpty><CommandGroup heading="Navigate"><CommandItem onSelect={() => go("/dashboard")}><LayoutDashboard />Command Center<CommandShortcut>G D</CommandShortcut></CommandItem><CommandItem onSelect={() => go("/explorer")}><Map />Project Explorer</CommandItem><CommandItem onSelect={() => go("/alerts")}><BellRing />Early Warnings</CommandItem><CommandItem onSelect={() => go("/assistant")}><Bot />AI Assistant</CommandItem><CommandItem onSelect={() => go("/simulator")}><Gauge />Run Risk Simulator</CommandItem><CommandItem onSelect={() => go("/profile")}><UserRound />Profile & preferences</CommandItem><CommandItem onSelect={() => go("/audit-history")}><ClipboardList />Audit history</CommandItem></CommandGroup><CommandGroup heading="Presentation"><CommandItem onSelect={() => go("/presentation")}><Presentation />Open presentation mode</CommandItem><CommandItem onSelect={() => go("/explorer?risk=Critical")}><AlertTriangle />Review critical projects</CommandItem></CommandGroup></CommandList></CommandDialog>
  </>;
}
