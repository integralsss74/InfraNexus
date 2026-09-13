import { beforeEach, describe, expect, it, vi } from "vitest";

const { invokeLLMMock } = vi.hoisted(() => ({ invokeLLMMock: vi.fn() }));
vi.mock("./_core/llm", () => ({ invokeLLM: invokeLLMMock }));
import { answerWithGroundedAssistant } from "./assistantService";

describe("grounded assistant service", () => {
  beforeEach(() => invokeLLMMock.mockReset());

  it("responds helpfully to a greeting without requesting model access", async () => {
    const response = await answerWithGroundedAssistant("Hi", { answer: "Insufficient project data available.", sources: [] });
    expect(response.answer).toContain("Hello");
    expect(response.answer).toContain("synthetic demonstration portfolio");
    expect(response.mode).toBe("controlled-fallback");
  });

  it("explains its capabilities when asked what it is", async () => {
    const response = await answerWithGroundedAssistant("What are you?", { answer: "Insufficient project data available.", sources: [] });
    expect(response.answer).toContain("PAIMANA AI");
    expect(response.answer).toContain("what-if simulator");
    expect(response.mode).toBe("controlled-fallback");
  });

  it("uses a real-model response when available while retaining controlled source references", async () => {
    invokeLLMMock.mockResolvedValue({ choices: [{ message: { content: "Project P-0004 should be reviewed first based on the supplied synthetic evidence." } }] });
    const response = await answerWithGroundedAssistant("Why is P-0004 high risk?", { answer: "Controlled evidence for P-0004.", sources: ["P-0004"] });
    expect(response.answer).toContain("P-0004");
    expect(response.sources).toEqual(["P-0004"]);
    expect(response.mode).toBe("llm-grounded");
  });
});
