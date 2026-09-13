import { describe, expect, it } from "vitest";
import { BUILT_IN_PERSONAS, WORKFLOW_STATUSES } from "./workingPersonas";

describe("working personas", () => {
  it("provides bounded local simulation lenses", () => {
    expect(BUILT_IN_PERSONAS.map((persona) => persona.name)).toEqual(["Programme analyst", "Agency officer", "Senior reviewer"]);
    expect(BUILT_IN_PERSONAS.every((persona) => persona.builtIn)).toBe(true);
    expect(BUILT_IN_PERSONAS.every((persona) => persona.statuses.every((status) => WORKFLOW_STATUSES.includes(status)))).toBe(true);
  });

  it("does not model a real account role as a persona capability", () => {
    expect(BUILT_IN_PERSONAS.flatMap((persona) => persona.capabilities)).not.toContain("admin");
  });
});
