import { Check, TrendingDown, TrendingUp } from "lucide-react";
import { buildTreeShapWaterfall, waterfallPosition, type TreeShapContribution } from "@/lib/treeShapWaterfall";

type TreeShapWaterfallProps = {
  baseValue: number | null;
  predictedOutput: number | null;
  contributions: TreeShapContribution[];
  enabled: boolean;
  compact?: boolean;
};

export function TreeShapWaterfall({ baseValue, predictedOutput, contributions, enabled, compact = false }: TreeShapWaterfallProps) {
  if (!enabled || baseValue === null || predictedOutput === null) return <div role="status" className="rounded-xl border border-dashed border-[#cbd9e4] bg-[#f7fafc] p-4 text-xs leading-5 text-[#597187]">The TreeSHAP waterfall is available only from the configured FastAPI sidecar. PAIMANA does not draw heuristic or fallback contributions as TreeSHAP evidence.</div>;
  const waterfall = buildTreeShapWaterfall(baseValue, contributions);
  const displayedPrediction = predictedOutput;
  const labelSize = compact ? "max-w-28" : "max-w-40";
  return <section aria-label="TreeSHAP contribution waterfall" className="rounded-xl border border-[#dbe7ef] bg-[#fbfdfe] p-4">
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold text-[#244e72]">TreeSHAP contribution waterfall</p><p className="mt-1 text-[11px] leading-5 text-[#698095]">Contributions are ordered by magnitude for reading. Each bar moves the model output from the base value toward the FastAPI prediction.</p></div><span className="inline-flex w-fit items-center gap-1 rounded-full border border-[#bedbd7] bg-[#f1faf8] px-2 py-1 text-[10px] font-semibold text-[#176b67]"><Check className="size-3" />Real TreeSHAP</span></div>
    <div className="grid grid-cols-2 gap-3 border-y border-[#e4edf3] py-3 text-xs"><div><p className="text-[10px] uppercase tracking-[0.12em] text-[#7a8ea1]">Base value</p><p className="mt-1 font-semibold text-[#173b5f]">{baseValue.toFixed(3)}</p></div><div className="border-l border-[#e4edf3] pl-3"><p className="text-[10px] uppercase tracking-[0.12em] text-[#7a8ea1]">FastAPI prediction</p><p className="mt-1 font-semibold text-[#173b5f]">{displayedPrediction.toFixed(3)}</p></div></div>
    <div className="mt-4 space-y-3">{waterfall.rows.map((row) => { const start = waterfallPosition(row.start, waterfall.min, waterfall.max); const end = waterfallPosition(row.end, waterfall.min, waterfall.max); const left = Math.min(start, end); const width = Math.max(1.5, Math.abs(end - start)); const rises = row.contribution >= 0; return <div key={row.feature} className="grid grid-cols-[minmax(0,1fr)_minmax(150px,2fr)_auto] items-center gap-3"><div className={`truncate text-[11px] font-medium text-[#3a5871] ${labelSize}`} title={row.feature}>{row.feature}<span className="ml-1 text-[#8293a4]">({row.value})</span></div><div className="relative h-7 overflow-hidden rounded-md bg-[#eef3f6]" aria-label={`${row.feature}: ${row.contribution >= 0 ? "increases" : "decreases"} the model output by ${Math.abs(row.contribution).toFixed(3)} from ${row.start.toFixed(3)} to ${row.end.toFixed(3)}`}><span className="absolute inset-y-0 w-px bg-[#c5d4df]" style={{ left: `${start}%` }} /><span className={`absolute top-1 bottom-1 rounded-sm ${rises ? "bg-[#cf6167]" : "bg-[#3c9b76]"}`} style={{ left: `${left}%`, width: `${width}%` }} /></div><span className={`inline-flex min-w-16 items-center justify-end gap-1 text-[11px] font-semibold ${rises ? "text-[#bd4d5a]" : "text-[#2e8968]"}`}>{rises ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}{rises ? "+" : ""}{row.contribution.toFixed(3)}</span></div>; })}</div>
    <p className="mt-4 border-t border-[#e4edf3] pt-3 text-[10px] leading-5 text-[#718599]">The plotted contribution path is explanatory, not causal. It is derived from deterministic synthetic inputs and must not be used as an official decision rule.</p>
  </section>;
}
