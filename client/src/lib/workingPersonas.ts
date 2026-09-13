import { useEffect, useState } from "react";

export const WORKFLOW_STATUSES = ["New", "Awaiting agency", "Response received", "Under review", "Intervention approved", "Closed"] as const;
export type WorkflowStatus = typeof WORKFLOW_STATUSES[number];
export type SimulationCapability = "triage" | "change-status" | "submit-response" | "approve" | "close" | "acknowledge";
export type WorkingPersona = { id: string; name: string; description: string; statuses: WorkflowStatus[]; capabilities: SimulationCapability[]; builtIn?: boolean };

const STORAGE_KEY = "paimana-working-personas-v1";
const CHANGE_EVENT = "paimana-working-personas-change";

export const BUILT_IN_PERSONAS: WorkingPersona[] = [
  { id: "programme-analyst", name: "Programme analyst", description: "Local triage lens for New, Awaiting agency, and Under review cases.", statuses: ["New", "Awaiting agency", "Under review"], capabilities: ["triage", "acknowledge"], builtIn: true },
  { id: "agency-officer", name: "Agency officer", description: "Local response lens for an agency-side workflow rehearsal.", statuses: ["Awaiting agency", "Response received"], capabilities: ["submit-response"], builtIn: true },
  { id: "senior-reviewer", name: "Senior reviewer", description: "Local review lens with simulated status and approval actions.", statuses: [...WORKFLOW_STATUSES], capabilities: ["triage", "change-status", "submit-response", "approve", "close", "acknowledge"], builtIn: true },
];

type PersonaState = { custom: WorkingPersona[]; activeId: string };
const initialState: PersonaState = { custom: [], activeId: "programme-analyst" };

function readState(): PersonaState {
  if (typeof window === "undefined") return initialState;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<PersonaState> | null;
    return { custom: Array.isArray(parsed?.custom) ? parsed.custom : [], activeId: typeof parsed?.activeId === "string" ? parsed.activeId : initialState.activeId };
  } catch { return initialState; }
}

function writeState(state: PersonaState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useWorkingPersonas() {
  const [state, setState] = useState<PersonaState>(readState);
  useEffect(() => { const refresh = () => setState(readState()); window.addEventListener(CHANGE_EVENT, refresh); window.addEventListener("storage", refresh); return () => { window.removeEventListener(CHANGE_EVENT, refresh); window.removeEventListener("storage", refresh); }; }, []);
  const personas = [...BUILT_IN_PERSONAS, ...state.custom];
  const active = personas.find((persona) => persona.id === state.activeId) ?? BUILT_IN_PERSONAS[0];
  return {
    personas,
    active,
    setActive: (activeId: string) => writeState({ ...state, activeId }),
    add: (persona: Omit<WorkingPersona, "id" | "builtIn">) => {
      const id = `custom-${Date.now()}`;
      writeState({ custom: [...state.custom, { ...persona, id }], activeId: id });
    },
    remove: (id: string) => writeState({ custom: state.custom.filter((persona) => persona.id !== id), activeId: state.activeId === id ? initialState.activeId : state.activeId }),
  };
}
