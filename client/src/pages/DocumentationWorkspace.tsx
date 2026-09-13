import { BookOpenCheck, Database, FileUp, Landmark, ShieldCheck, SlidersHorizontal, UserRound, Workflow } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { useLocation } from "wouter";

type Step = { title: string; body: string };
type DocumentationSection = {
  eyebrow: string;
  title: string;
  description: string;
  action: string;
  path: string;
  Icon: typeof FileUp;
  callout: string;
  steps: Step[];
};

const sections: DocumentationSection[] = [
  {
    eyebrow: "Data intake",
    title: "Where to feed new project data",
    description: "Use Import PAIMANA export in the left navigation. It is the active data-feed path for the demo, and it replaces only the current browser portfolio after final confirmation.",
    action: "Open import workspace",
    path: "/import",
    Icon: FileUp,
    callout: "Important: importing data changes the active portfolio in this browser session. It does not automatically train a new model or overwrite authoritative Government records. Use only authorised exports and validate source fields before operational use.",
    steps: [
      { title: "Choose CSV or XLSX", body: "Upload a CUF-style project export. For XLSX, choose the worksheet that contains the project table." },
      { title: "Map source headers", body: "Confirm the source-to-PAIMANA field mapping. Project name, sector and implementing agency are required." },
      { title: "Review samples and errors", body: "Check sample rows, missing columns, size limits, malformed values and skipped-record warnings before final import." },
      { title: "Confirm the active register", body: "The mapped records become the active portfolio for this session. Signed-in imports also retain an original-file archive and selected worksheet metadata." },
    ],
  },
  {
    eyebrow: "Simulation roles",
    title: "Configure custom working personas",
    description: "The working-persona selector affects which simulated intervention actions appear in the review workflow. It is deliberately separate from database-backed access control.",
    action: "Configure personas",
    path: "/workflow-settings",
    Icon: SlidersHorizontal,
    callout: "Operational example: create a “State monitoring lead” persona with triage access to New, Awaiting agency and Under review. Create an “Agency focal point” persona with the response ability only. Then use the visible restrictions to rehearse the intended review handoff.",
    steps: [
      { title: "Open Workflow setup", body: "Review the three built-in simulations: programme analyst, agency officer and senior reviewer." },
      { title: "Create a custom role", body: "Enter a role name and description, then select workflow statuses and additional abilities such as agency response or approval simulation." },
      { title: "Select it in Working persona", body: "Use the rail selector to apply the custom role. The Intervention reviews page then exposes only its configured simulation controls." },
      { title: "Keep identity boundaries clear", body: "Simulation personas are local workflow lenses. They do not modify your real sign-in role, server-side administrative permissions or another user’s account." },
    ],
  },
  {
    eyebrow: "Account and access",
    title: "How sign-in information is stored",
    description: "PAIMANA uses the managed OAuth identity flow. The app never requests or stores a password. After a successful sign-in, the authenticated user record is created or refreshed in the managed database.",
    action: "View account record",
    path: "/account",
    Icon: UserRound,
    callout: "Access boundary: your database-backed account role controls protected API rights. A working persona remains a local workflow simulation only; it cannot elevate a user’s real access.",
    steps: [
      { title: "Open the pre-login page", body: "Visitors begin at the public PAIMANA overview and select Sign in to PAIMANA." },
      { title: "Complete managed identity sign-in", body: "The identity provider returns the authenticated Open ID and available profile information." },
      { title: "Persist the account profile", body: "The secured user record stores Open ID, display name, email, identity method, account role and last-sign-in timestamp." },
      { title: "Review the Account workspace", body: "Open Account from the rail to inspect the profile returned from the database and sign out securely." },
    ],
  },
  {
    eyebrow: "Administration and first access",
    title: "Manage shared access responsibly",
    description: "Only server-authenticated administrators can open Administration. The first authenticated visit is paused at the acceptable-use agreement; the accepted policy version and timestamp are stored against the user record.",
    action: "Open administration",
    path: "/admin",
    Icon: Landmark,
    callout: "Governance note: team membership enables shared collaboration metadata. It does not override account-level administrator checks or establish authority to make an official decision.",
    steps: [
      { title: "Set account roles", body: "Administrators can assign User or Administrator access. The interface prevents an administrator from removing their own admin role." },
      { title: "Create organisations", body: "Use organisations as durable access boundaries for a ministry, programme office, state cell or other authorised group." },
      { title: "Create teams and assign members", body: "Place users in an organisation and then operational teams with owner, administrator, manager, member or viewer membership levels." },
      { title: "Respect the policy gate", body: "New users must accept the acceptable-use terms before they access the portfolio. Revisions can be recorded by updating the policy version." },
    ],
  },
];

function DocumentationSectionCard({ section }: { section: DocumentationSection }) {
  const [, setLocation] = useLocation();
  const { Icon } = section;
  return <section className="rounded-xl border border-[#d7e3df] bg-white p-5 shadow-[0_7px_22px_rgba(23,55,54,.045)] sm:p-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="max-w-3xl"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#147b77]">{section.eyebrow}</p><h2 className="mt-2 font-serif text-[24px] leading-[1.1] tracking-[-0.035em] text-[#17283a] sm:text-[27px]">{section.title}</h2><p className="mt-2 text-[11px] leading-5 text-[#64767b]">{section.description}</p></div><Button onClick={() => setLocation(section.path)} className="shrink-0 bg-[#147b77] text-[11px] shadow-sm hover:bg-[#0f6763]"><Icon className="mr-1.5 size-3.5" />{section.action}</Button></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{section.steps.map((step, index) => <article key={step.title} className="rounded-lg bg-[#f6faf8] p-3"><div className="flex items-start gap-2"><span className="grid size-4 shrink-0 place-items-center rounded-full bg-[#147b77] text-[9px] font-bold text-white">{index + 1}</span><div><h3 className="text-[10px] font-bold text-[#2c4a50]">{step.title}</h3><p className="mt-1 text-[10px] leading-[1.55] text-[#687b80]">{step.body}</p></div></div></article>)}</div>
    <div className="mt-4 flex gap-2 border-l-[3px] border-[#147b77] bg-[#eff9f5] px-3 py-2.5"><Icon className="mt-0.5 size-3.5 shrink-0 text-[#147b77]" /><p className="text-[10px] leading-[1.5] text-[#49656a]">{section.callout}</p></div>
  </section>;
}

export default function DocumentationWorkspace() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="grid min-h-[52vh] place-items-center text-sm text-[#64767b]">Checking protected workspace access…</div>;
  if (!isAuthenticated) return <section className="mx-auto max-w-2xl pt-6"><div className="border-l-[3px] border-[#147b77] pl-3"><p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#147b77]">Method documentation</p><h1 className="mt-2 font-serif text-3xl tracking-[-0.04em] text-[#17283a]">Sign in to open the operational guide.</h1><p className="mt-2 text-sm leading-6 text-[#61747a]">This documentation describes protected import, account, administration, and workflow controls. Sign in to review the governed workspace and its acceptable-use boundary.</p></div><div className="mt-5 rounded-xl border border-[#d7e3df] bg-white p-6 shadow-sm"><ShieldCheck className="size-7 text-[#147b77]" /><p className="mt-3 text-sm leading-6 text-[#516b71]">The command desk uses synthetic demonstration data by default. Predictions, warnings, explanations, and briefs remain analytical decision-support outputs subject to human review.</p><Button onClick={() => startLogin()} className="mt-5 bg-[#147b77] hover:bg-[#0f6763]">Sign in to PAIMANA</Button></div></section>;
  return <div className="mx-auto max-w-[1420px] pb-6">
    <header className="border-b border-[#dce5e1] pb-5 pt-1"><div className="flex flex-col gap-5 border-l-[3px] border-[#147b77] pl-3 sm:flex-row sm:items-end sm:justify-between"><div className="max-w-3xl"><p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#147b77]">Method documentation</p><h1 className="mt-2 font-serif text-[30px] leading-[1.05] tracking-[-0.045em] text-[#17283a] sm:text-[36px]">Operate the monitoring workflow with clear boundaries.</h1><p className="mt-2 max-w-2xl text-[11px] leading-[1.55] text-[#64767b]">Use this workspace to understand PAIMANA’s synthetic demonstration data, working-persona simulation, data import route, and human-review safeguards.</p></div><div className="min-w-32 border-l border-[#dce5e1] pl-4"><p className="text-[9px] text-[#87979a]">Mode</p><p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#17283a]">Demo</p><p className="mt-1 text-[9px] text-[#87979a]">Synthetic data only</p></div></div></header>
    <div className="mt-5 grid gap-4 lg:grid-cols-2"><section className="rounded-xl border border-[#d7e3df] bg-white p-5 shadow-[0_7px_22px_rgba(23,55,54,.045)]"><BookOpenCheck className="size-5 text-[#147b77]" /><h2 className="mt-3 font-serif text-xl tracking-[-0.03em] text-[#17283a]">System methodology</h2><ol className="mt-3 space-y-2 text-[10px] leading-[1.65] text-[#61747a]"><li><strong className="text-[#2d4b51]">Ingest and validate.</strong> CSV/XLSX exports are previewed, mapped and checked before the active portfolio changes.</li><li><strong className="text-[#2d4b51]">Predict and score.</strong> Baseline and random-forest models estimate cost and schedule risk from synthetic delivery signals.</li><li><strong className="text-[#2d4b51]">Detect early warnings.</strong> Progress gaps, expenditure imbalance, milestone slippage, escalation and risk acceleration generate transparent alerts.</li><li><strong className="text-[#2d4b51]">Explain and prioritise.</strong> Feature importance, trajectories, comparisons and review workflows provide evidence for human judgment.</li></ol></section><section className="rounded-xl border border-[#d7e3df] bg-white p-5 shadow-[0_7px_22px_rgba(23,55,54,.045)]"><ShieldCheck className="size-5 text-[#147b77]" /><h2 className="mt-3 font-serif text-xl tracking-[-0.03em] text-[#17283a]">Data and decision safeguards</h2><div className="mt-3 space-y-2 text-[10px] leading-[1.65] text-[#61747a]"><p><strong className="text-[#2d4b51]">Synthetic Demonstration Dataset.</strong> This platform is a technology demonstration based on synthetic/demo data unless connected to an authorized PAIMANA data source.</p><p>Predictions, warnings and recommendations are analytical outputs. They should not be interpreted as official Government of India decisions and should be reviewed against authorised source records.</p><p>Natural-language assistance is grounded only in supplied portfolio data; unavailable fields should be treated as insufficient data rather than inferred facts.</p></div></section></div>
    <div className="mt-4 space-y-4">{sections.map((section) => <DocumentationSectionCard key={section.eyebrow} section={section} />)}</div>
    <div className="mt-4 flex gap-2 border-l-[3px] border-[#147b77] bg-[#eff9f5] px-4 py-3"><Database className="mt-0.5 size-4 shrink-0 text-[#147b77]" /><p className="text-[10px] leading-5 text-[#48636a]"><strong>Operational boundary.</strong> Protected actions remain behind authenticated server procedures. Original import artifacts belong in server-side object storage with metadata in relational storage; local personas cannot alter real roles, and every operational output requires responsible human review.</p></div>
  </div>;
}
