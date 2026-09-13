import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Check, FileSpreadsheet, FileText, ShieldCheck, Upload } from "lucide-react";
import { useRef, useState } from "react";

type ImportPreview = { sheetNames: string[]; selectedWorksheet: string; columns: string[]; preview: string[][]; rowsDetected: number; missingValues: number; invalidRows: number; mappedFields: string[]; validationStatus: string };
const requiredFields = [{ key: "project_name", label: "Project name" }, { key: "sector", label: "Sector" }, { key: "agency", label: "Agency / implementing body" }];
const fileLimitBytes = 5_000_000;

function DemoNotice() {
  return <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#cbdcf0] bg-[#f3f8fe] px-4 py-3 text-xs leading-5 text-[#385878]"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#32669b]" /><span><strong>Synthetic Demonstration Dataset.</strong> Source files are staged for governed validation. They never replace the synthetic portfolio automatically, and their raw bytes are retained outside the relational database.</span></div>;
}

export default function GovernedDataManagement() {
  const input = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [worksheetName, setWorksheetName] = useState("");
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const previewMutation = trpc.portfolio.importPreview.useMutation({ onSuccess: data => {
    setPreview(data);
    setWorksheetName(data.selectedWorksheet);
    setMapping(current => Object.fromEntries(requiredFields.map(field => {
      const retained = current[field.key];
      const automatic = data.columns.find(column => column.toLowerCase().replaceAll(" ", "_") === field.key);
      return [field.key, retained && data.columns.includes(retained) ? retained : automatic ?? "unmapped"];
    })));
  }, onError: error => setNotice(error.message) });
  const importMutation = trpc.portfolio.importSource.useMutation({ onSuccess: data => { setNotice(data.message); void utils.portfolio.importHistory.invalidate(); }, onError: error => setNotice(error.message) });
  const history = trpc.portfolio.importHistory.useQuery();

  const stagePreview = (selected: File, selectedWorksheet?: string) => {
    const reader = new FileReader();
    reader.onload = () => previewMutation.mutate({ filename: selected.name, contentBase64: String(reader.result).split(",")[1] ?? "", worksheetName: selectedWorksheet || undefined });
    reader.onerror = () => setNotice("The source file could not be read for validation.");
    reader.readAsDataURL(selected);
  };
  const choose = (selected?: File) => {
    if (!selected) return;
    if (!/\.(csv|xls|xlsx)$/i.test(selected.name)) { setFile(null); setPreview(null); setNotice("Unsupported source file. Choose a CSV, XLS, or XLSX file."); return; }
    if (selected.size > fileLimitBytes) { setFile(null); setPreview(null); setNotice("Source file exceeds the 5 MB governed import limit."); return; }
    setFile(selected); setPreview(null); setWorksheetName(""); setMapping({}); setNotice(""); stagePreview(selected);
  };
  const chooseWorksheet = (value: string) => { if (!file) return; setWorksheetName(value); setPreview(null); stagePreview(file, value); };
  const store = () => {
    if (!file || !preview) return;
    if (requiredFields.some(field => !mapping[field.key] || mapping[field.key] === "unmapped")) { setNotice("Map project name, sector, and agency before storing a governed source file."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const contentBase64 = String(reader.result).split(",")[1] ?? "";
      const contentType = file.name.toLowerCase().endsWith(".csv") ? "text/csv" : file.name.toLowerCase().endsWith(".xlsx") ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "application/vnd.ms-excel";
      importMutation.mutate({ filename: file.name, contentType, contentBase64, worksheetName: preview.selectedWorksheet, mapping });
    };
    reader.onerror = () => setNotice("The source file could not be prepared for secure staging.");
    reader.readAsDataURL(file);
  };
  const mappedCount = requiredFields.filter(field => mapping[field.key] && mapping[field.key] !== "unmapped").length;

  return <><div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#61738a]">Controlled data ingestion</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#102a43]">Data Management</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f7382]">Validate a bounded source file, choose the appropriate worksheet, map governance fields, then stage it for review.</p></div><Badge variant="outline" className="border-[#bcd9d5] bg-[#f0faf7] text-[#176b67]">5 MB maximum · source archive protected</Badge></div><DemoNotice />
    <div className="grid gap-5 xl:grid-cols-12"><section className="rounded-xl border border-[#dce4ed] bg-white p-5 shadow-[0_8px_24px_rgba(32,57,85,0.045)] xl:col-span-8"><input ref={input} type="file" accept=".csv,.xls,.xlsx" className="hidden" onChange={event => choose(event.target.files?.[0])} /><div className="rounded-xl border border-dashed border-[#aebfd0] bg-[#f8fbfd] p-8 text-center"><Upload className="mx-auto size-8 text-[#327b78]" /><h2 className="mt-3 text-sm font-semibold text-[#244d62]">Stage a governed source file</h2><p className="mx-auto mt-2 max-w-xl text-xs leading-5 text-[#708195]">CSV, XLS, and XLSX are accepted up to 5 MB. Excel workbooks are previewed sheet by sheet before any source-file archive record is created.</p><Button className="mt-5 bg-[#147b77] hover:bg-[#0e6763]" onClick={() => input.current?.click()}><FileSpreadsheet className="mr-2 size-3.5" />Choose source file</Button></div>{file ? <div className="mt-4 rounded-lg border border-[#dce6ef] bg-white p-4"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><FileText className="size-5 shrink-0 text-[#327b78]" /><div className="min-w-0"><p className="truncate text-xs font-semibold text-[#305574]">{file.name}</p><p className="text-[11px] text-[#748497]">{(file.size / 1_000_000).toFixed(2)} MB · staged for validation</p></div></div><Button size="sm" onClick={store} disabled={importMutation.isPending || !preview || mappedCount !== requiredFields.length}>{importMutation.isPending ? "Staging…" : "Store & record metadata"}</Button></div>{preview?.sheetNames && preview.sheetNames.length > 1 ? <div className="mt-4 max-w-sm"><Label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#58707f]">Workbook worksheet</Label><Select value={worksheetName || preview.selectedWorksheet} onValueChange={chooseWorksheet}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent>{preview.sheetNames.map(sheet => <SelectItem value={sheet} key={sheet}>{sheet}</SelectItem>)}</SelectContent></Select></div> : null}</div> : null}{notice ? <div role={notice.includes("stored") ? "status" : "alert"} className={`mt-3 rounded-lg border p-3 text-xs ${notice.includes("stored") ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>{notice}</div> : null}</section><section className="rounded-xl border border-[#dce4ed] bg-white p-5 shadow-[0_8px_24px_rgba(32,57,85,0.045)] xl:col-span-4"><h2 className="text-sm font-semibold text-[#173b5f]">Governed intake controls</h2><div className="mt-5 space-y-3">{["CSV, XLS, and XLSX validation", "5 MB raw-file boundary", "Worksheet-aware Excel preview", "Required project name, sector, and agency mapping", "Archived raw source outside the database"].map(item => <div key={item} className="flex items-start gap-3 text-xs leading-5 text-[#587086]"><Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />{item}</div>)}</div></section></div>
    {preview ? <div className="mt-5 grid gap-5 xl:grid-cols-12"><section className="rounded-xl border border-[#dce4ed] bg-white p-5 shadow-[0_8px_24px_rgba(32,57,85,0.045)] xl:col-span-4"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-[#173b5f]">Map governed fields</h2><Badge variant="outline" className="border-[#c7dcd8] bg-[#f3faf8] text-[#236b66]">{mappedCount} / {requiredFields.length}</Badge></div><p className="mt-2 text-[11px] leading-5 text-[#6a7f8f]">Mappings are recorded with the import metadata and do not overwrite the demonstration portfolio.</p><div className="mt-5 space-y-4">{requiredFields.map(field => <div key={field.key}><Label className="mb-1.5 block text-xs text-[#4e6880]">{field.label}</Label><Select value={mapping[field.key] ?? "unmapped"} onValueChange={value => setMapping(current => ({ ...current, [field.key]: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unmapped">Select source column</SelectItem>{preview.columns.map(column => <SelectItem key={column} value={column}>{column}</SelectItem>)}</SelectContent></Select></div>)}</div></section><section className="rounded-xl border border-[#dce4ed] bg-white p-5 shadow-[0_8px_24px_rgba(32,57,85,0.045)] xl:col-span-8"><div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-sm font-semibold text-[#173b5f]">Validation preview</h2><p className="mt-1 text-[11px] text-[#6a7f8f]">{preview.selectedWorksheet || "Default sheet"} · {preview.rowsDetected} records · {preview.missingValues} empty cells · {preview.invalidRows} invalid rows</p></div><Badge variant="outline" className={preview.validationStatus === "validated" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>{preview.validationStatus}</Badge></div><div className="-mx-5 mt-5 overflow-x-auto"><Table><TableHeader><TableRow>{preview.columns.map(column => <TableHead key={column}>{column}</TableHead>)}</TableRow></TableHeader><TableBody>{preview.preview.map((row, index) => <TableRow key={index}>{row.map((cell, cellIndex) => <TableCell key={`${index}-${cellIndex}`} className="text-xs">{cell || <span className="text-rose-500">Missing</span>}</TableCell>)}</TableRow>)}</TableBody></Table></div></section></div> : null}
    <section className="mt-5 rounded-xl border border-[#dce4ed] bg-white p-5 shadow-[0_8px_24px_rgba(32,57,85,0.045)]"><h2 className="text-sm font-semibold text-[#173b5f]">Import history</h2><p className="mt-1 text-[11px] text-[#6a7f8f]">File metadata is visible here; raw source bytes remain in protected object storage.</p><div className="mt-4 divide-y divide-[#e8edf1]">{history.isLoading ? <p role="status" className="rounded-lg bg-[#f8fbf9] p-4 text-xs text-[#718189]">Loading governed source history…</p> : history.isError ? <div role="alert" className="rounded-lg border border-[#e5c8c4] bg-[#fff7f5] p-4 text-xs text-[#8b4b45]">Import history could not be loaded. <button onClick={() => history.refetch()} className="font-semibold underline">Retry</button></div> : history.data?.length ? history.data.map(item => <div key={item.id} className="flex items-center justify-between gap-4 py-3 first:pt-0"><div className="flex min-w-0 items-center gap-3"><FileSpreadsheet className="size-4 shrink-0 text-[#327b78]" /><div className="min-w-0"><p className="truncate text-xs font-semibold text-[#315675]">{item.originalFilename}</p><p className="mt-1 text-[10px] text-[#78889a]">{item.rowsDetected} rows · {item.validationStatus} · {new Date(item.createdAt).toLocaleString()}</p></div></div><a href={item.storageUrl} className="text-xs font-semibold text-[#147b77]">Stored file</a></div>) : <p className="rounded-lg bg-[#f8fbf9] p-4 text-xs text-[#718189]">No governed source files have been staged in this workspace.</p>}</div></section>
  </>;
}
