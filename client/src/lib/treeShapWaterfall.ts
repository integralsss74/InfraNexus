export type TreeShapContribution = {
  feature: string;
  value: number;
  contribution: number;
  direction: "positive" | "negative";
};

export type TreeShapWaterfallRow = TreeShapContribution & {
  start: number;
  end: number;
};

export function buildTreeShapWaterfall(baseValue: number, contributions: TreeShapContribution[]) {
  const sorted = [...contributions]
    .sort((left, right) => Math.abs(right.contribution) - Math.abs(left.contribution))
    .slice(0, 8);
  let running = baseValue;
  const rows = sorted.map((item) => {
    const start = running;
    const end = Number((running + item.contribution).toFixed(8));
    running = end;
    return { ...item, start, end };
  });
  const domainValues = [baseValue, running, ...rows.flatMap((row) => [row.start, row.end])];
  const min = Math.min(0, ...domainValues);
  const max = Math.max(1, ...domainValues);
  return { baseValue, predictedOutput: running, rows, min, max };
}

export function waterfallPosition(value: number, min: number, max: number) {
  const span = Math.max(0.000001, max - min);
  return ((value - min) / span) * 100;
}
