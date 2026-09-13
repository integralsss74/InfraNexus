import { describe, expect, it } from "vitest";
import { buildTreeShapWaterfall, waterfallPosition } from "./treeShapWaterfall";

describe("TreeSHAP waterfall accounting", () => {
  const contributions = [
    { feature: "Delay", value: 4, contribution: 0.25, direction: "positive" as const },
    { feature: "Progress", value: 62, contribution: -0.1, direction: "negative" as const },
  ];

  it("reconciles an ordered contribution sequence from the base value", () => {
    const waterfall = buildTreeShapWaterfall(0.4, contributions);
    expect(waterfall.rows[0]).toMatchObject({ feature: "Delay", start: 0.4, end: 0.65 });
    expect(waterfall.predictedOutput).toBeCloseTo(0.55, 8);
  });

  it("maps waterfall values into a visual domain", () => {
    expect(waterfallPosition(0.5, 0, 1)).toBe(50);
  });
});
