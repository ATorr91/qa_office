// What each project's Drive folder says about it: scope, objectives, deliverables, key dates and the files inside (Figma, sheets,
// documents...). The snapshot is read from Drive by Claude and saved in projectDocsData.ts, so it is as fresh as its `syncedOn`
// date shows. A folder linked by hand in Admin (links.drive) always works as a link even when there is no snapshot.
import { PROJECT_BRIEFS } from "./projectDocsData";

export type DocKind = "figma" | "sheet" | "doc" | "slides" | "pdf" | "video" | "image" | "folder" | "other";

export const DOC_KIND_LABELS: Record<DocKind, string> = {
  figma: "Figma",
  sheet: "Hojas de cálculo",
  doc: "Documentos",
  slides: "Presentaciones",
  pdf: "PDF",
  video: "Video",
  image: "Imágenes",
  folder: "Carpetas",
  other: "Otros",
};

export const DOC_KIND_ORDER: DocKind[] = ["figma", "sheet", "doc", "slides", "pdf", "video", "image", "folder", "other"];

export interface ProjectDoc {
  name: string;
  kind: DocKind;
  url: string;
  /** "YYYY-MM-DD". */
  modified?: string;
  /** Subfolder under the project folder. */
  path?: string;
}

export interface ProjectBrief {
  folderUrl: string | null;
  scope: string[];
  objectives: string[];
  deliverables: string[];
  timeline: string[];
  docs: ProjectDoc[];
  /** Gaps or doubts found while reading the folder. */
  notes: string;
  /** Names of the documents the summary was written from. */
  sourcedFrom: string[];
}

export { DRIVE_SYNCED_ON } from "./projectDocsData";

export const briefOf = (projectId: string): ProjectBrief | null => PROJECT_BRIEFS[projectId] ?? null;

/** Safe to open in a new tab: only http(s). */
export const safeDocUrl = (u: string) => (/^https?:\/\//i.test(u) ? u : null);
