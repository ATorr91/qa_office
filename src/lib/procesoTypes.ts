// Shapes of the "Proceso de Estrategas" draft (5 stages). Pure data types: the page, the Markdown export and, later, the
// dashboard integration all read the same content from procesoStages.ts.

export type StageId = "discovery" | "build" | "testing" | "entrega" | "futureproof";

/** When inside the stage a sub-stage happens: at the start, in the body of the stage, or to close it. */
export type ChecklistPhase = "principio" | "despues" | "final";

export interface ChecklistGroup {
  title: string;
  /** Groups are listed in this order inside every stage: principio, despues, final. */
  phase: ChecklistPhase;
  items: string[];
}

/** Standard operating procedure: short, numbered, owned by a role. */
export interface Sop {
  title: string;
  /** External document of the team (Drive, Notion...) or a public reference. Optional: Admin can set the team document. */
  url?: string;
  /** Who runs it. */
  owner: string;
  steps: string[];
}

export interface AcceptanceCriterion {
  criterion: string;
  /** What the client can open or see to verify it. */
  evidence: string;
}

export interface StageTool {
  name: string;
  use: string;
}

/** A Claude skill available in the team's environment, and what it is for in this stage. */
export interface StageSkill {
  name: string;
  use: string;
}

/** An agent worth building for the stage. The strategist always keeps the checkpoint. */
export interface StageAgent {
  name: string;
  does: string;
  humanCheck: string;
}

/** `existe`: the dashboard already has it; `por-integrar`: needs a source wired in; `manual`: typed by hand in Admin until a source exists. */
export type SignalStatus = "existe" | "por-integrar" | "manual";

export interface DashboardSignal {
  metric: string;
  source: string;
  status: SignalStatus;
}

export type ExampleStatus = "confirmado" | "candidato" | "por-elegir";

export interface StageExample {
  title: string;
  /** Where to find it (internal route or asset), or null when it still has to be chosen. */
  href: string | null;
  note: string;
  /** `candidato`: a real project from the catalog proposed as reference, still to be confirmed by the team. Defaults to confirmado with a link, por-elegir without. */
  status?: ExampleStatus;
}

/** A file a stage needs before it can start (input) or must leave delivered (output). */
export interface StageFile {
  name: string;
  /** Type of file or where it lives: PDF, Google Doc, Figma, Sheet, enlace... */
  format: string;
  /** Inputs: who provides it. Outputs: where it is saved and who receives it. */
  where: string;
  /** What it holds, or why the stage cannot go without it. */
  note?: string;
  /** Inputs only: the stage whose output this is, when it comes from an earlier stage. */
  from?: StageId;
  /** Outputs only: the stages that pick it up later. */
  usedIn?: StageId[];
}

export interface StageIo {
  inputs: StageFile[];
  outputs: StageFile[];
}

export interface ProcessStage {
  id: StageId;
  number: number;
  name: string;
  /** One line: what this stage settles. */
  goal: string;
  /** Where the stage sits against BluePixel's services, when it does. */
  service?: string;
  /** Narrative of what happens in the stage (short paragraphs). */
  summary: string[];
  /** How the agile cadence runs in this stage (a proposal for the team to correct). */
  rhythm: string;
  checklist: ChecklistGroup[];
  /** The report that closes the stage, in the client acceptance format. */
  deliverable: {
    title: string;
    contents: string[];
    criteria: AcceptanceCriterion[];
  };
  /** Work that runs in parallel to the stage, when there is one (e.g. grading the commercial handoff, peer reviews). */
  parallel?: { title: string; points: string[] };
  tools: StageTool[];
  skills: StageSkill[];
  agents: StageAgent[];
  sops: Sop[];
  tips: string[];
  examples: StageExample[];
  /** What the stage hands to the dashboard so the strategist can be evaluated and the project followed. */
  signals: DashboardSignal[];
  /** Files the stage needs to start and must leave delivered. */
  io: StageIo;
}

export interface Pillar {
  name: string;
  idea: string;
  practices: string[];
}

export interface BrainModule {
  name: string;
  what: string;
  source: string;
  status: SignalStatus;
  /** Open question to settle, or what has to happen for the module to fill with real data. */
  open?: string;
  /** Where in the dashboard it lives, when it already does. */
  where?: { label: string; href: string };
}

export interface EvaluationGroup {
  id: "nomina" | "proveedor";
  name: string;
  /** Names of the people in the group. */
  members: string[];
  common: string[];
  extra: string[];
  pending?: string;
}
