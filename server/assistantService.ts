import { invokeLLM } from "./_core/llm";

export type GroundedAssistantResult = {
  answer: string;
  sources: string[];
  mode: "llm-grounded" | "controlled-fallback";
};

const greeting = /^(hi|hello|hey|good (morning|afternoon|evening))[!. ]*$/i;
const identityOrHelp = /^(what are you|who are you|what can you do|how can you help|help)[?!. ]*$/i;

export async function answerWithGroundedAssistant(question: string, controlled: { answer: string; sources: string[] }): Promise<GroundedAssistantResult> {
  const normalized = question.trim();
  if (greeting.test(normalized)) {
    return {
      answer: "Hello. I am PAIMANA AI’s infrastructure-risk assistant. I can help you explore the synthetic demonstration portfolio, explain a project risk, compare sectors or states, review early-warning signals, or guide you to the simulator. What would you like to investigate?",
      sources: [],
      mode: "controlled-fallback",
    };
  }

  if (identityOrHelp.test(normalized)) {
    return {
      answer: "I am PAIMANA AI, a grounded infrastructure-risk assistant for this synthetic demonstration workspace. I can explain project risk signals, compare states or sectors, surface early warnings, identify expenditure-versus-progress gaps, and explain what-if simulator assumptions. Try a suggested prompt, or ask about a project such as P-0004.",
      sources: [],
      mode: "controlled-fallback",
    };
  }

  const evidenceUnavailable = controlled.answer.startsWith("Insufficient project data available");
  try {
    const response = await invokeLLM({
      model: process.env.LLM_MODEL || "openai/gpt-4o-mini",
      maxTokens: 340,
      messages: [
        {
          role: "system",
          content: "You are the PAIMANA AI infrastructure-risk assistant. Reply in concise, professional plain text. You must not invent project facts, sources, scores, metrics, alerts, or policy conclusions. Use only the controlled evidence supplied below for portfolio-specific statements. If evidence is unavailable, politely explain what information is supported and offer 2 useful portfolio questions. Always state that portfolio figures are synthetic demonstration data when discussing analytics.",
        },
        {
          role: "user",
          content: `User question: ${normalized}\n\nControlled evidence: ${controlled.answer}\n\nEvidence status: ${evidenceUnavailable ? "No project-specific evidence is available." : "Grounded evidence is available."}`,
        },
      ],
    });
    const content = response.choices[0]?.message.content;
    const answer = typeof content === "string" ? content.trim() : "";
    if (!answer) throw new Error("Empty assistant response");
    return { answer, sources: controlled.sources, mode: "llm-grounded" };
  } catch (err) {
    console.error("Grounded assistant LLM error:", err);
    return { answer: controlled.answer, sources: controlled.sources, mode: "controlled-fallback" };
  }
}
