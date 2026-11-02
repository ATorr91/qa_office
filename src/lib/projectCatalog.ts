// Catalog of BluePixel's client projects (code, cell, status, start and end dates, as listed in the project tracker) and
// which strategist each one is assigned to. This is the single place that says who works on what: the profile's project list
// is seeded from it and so are the accounts that QA reports, NPS surveys and CSAT are attributed to (see accounts.ts).
// Internal work items (vacations, training, fixed calls, public holidays, medical leave) are not client projects and are left out.
import type { ProjectAssignment, ProjectStatus } from "./strategists";

export interface CatalogProject {
  /** Tracker code, e.g. "395.02". Not unique: two Hogares Unión projects share "413.0X" until they get a number. */
  code: string;
  name: string;
  client: string;
  cell: string;
  status: ProjectStatus;
  /** "YYYY-MM-DD". */
  start: string;
  end: string;
  /** Jira project keys that hold this project's tickets (used to match activity to people). */
  jiraKeys: string[];
  /** Account in accounts.ts this project belongs to, when it has one: that account's QA/NPS/CSAT follows the project's team. */
  account?: string;
  flags?: ("internal" | "noBudget" | "overBudget")[];
}

const P = (
  code: string,
  name: string,
  client: string,
  cell: string,
  status: ProjectStatus,
  start: string,
  end: string,
  jiraKeys: string[] = [],
  account?: string,
  flags?: CatalogProject["flags"],
): CatalogProject => ({ code, name, client, cell, status, start, end, jiraKeys, account, flags });

export const PROJECT_CATALOG: CatalogProject[] = [
  P("386.01", "Peakland", "Peakland", "Automate", "inactive", "2025-07-07", "2026-10-31", ["PEAK", "PI"], "peak", ["internal"]),

  P("261.03", "Magenta Nuevos Requerimientos", "Magenta", "Cell 1", "inactive", "2026-08-06", "2026-08-10", ["MAG", "MAGEXT"]),
  P("426.00", "PMI Colombia", "PMI", "Cell 1", "active", "2026-04-30", "2026-12-31", ["PC"], undefined, ["noBudget"]),
  P("426.01", "PMI Colombia: Pases y Notificaciones", "PMI", "Cell 1", "completed", "2026-04-30", "2026-06-12", ["PPC", "PCN"]),
  P("426.02", "PMI Colombia - Requerimiento prioritario Wallet - DCX: Estimación de cambios en formulario de registro", "PMI", "Cell 1", "active", "2026-08-10", "2026-11-30", ["PC"]),
  P("427.01", "PMI Canada", "PMI", "Cell 1", "planned", "2026-10-01", "2026-12-31", [], undefined, ["noBudget"]),
  P("432.01", "PMI: Pases provisionales Together Club", "PMI", "Cell 1", "completed", "2026-10-01", "2026-10-27", ["PMITC"], undefined, ["noBudget"]),
  P("435.01", "P. Morris 65 hrs (julio 2026)", "PMI", "Cell 1", "active", "2026-08-03", "2026-12-31", ["PMIJ"]),

  P("395.01", "Transpais", "Transpais", "Cell 2", "active", "2025-08-19", "2025-12-23", ["TRP"], "transpais"),
  P("395.02", "Transpais: Future Proof", "Transpais", "Cell 2", "active", "2025-12-22", "2026-12-22", ["TFP", "TFPA"], "transpais"),
  P("395.03", "Transpais: Envios Express", "Transpais", "Cell 2", "paused", "2025-12-22", "2026-03-20", [], "transpais"),

  P("372.02", "Aqui hay trabajo", "Aquí hay trabajo", "Cell 3", "inactive", "2026-05-01", "2026-07-04", ["AHT", "AHTF2", "AHTCYC", "AHTD"], "aht"),
  P("372.05", "Aqui hay trabajo servidor + infra", "Aquí hay trabajo", "Cell 3", "inactive", "2026-05-01", "2026-11-26", ["AHTSI"], "aht"),
  P("377.04", "Kumpel: Plataforma Operativa Inteligente", "Kumpel", "Cell 3", "active", "2026-05-11", "2027-03-12", ["KMPOI"], "kumpel"),

  P("420.01", "APAC MVP: Servicios Neurorrobótica", "APAC", "Cell 4", "completed", "2026-04-13", "2026-07-07", ["APAC"], "apac"),
  P("421.01", "APAC Future Proof", "APAC", "Cell 4", "active", "2026-10-30", "2027-08-27", ["AFP"], "apac"),

  P("347.03", "Cemex (Fase 3)", "Cemex", "Cell 5", "active", "2026-07-01", "2027-02-28", ["CF3"], "cemex"),
  P("401.02", "David Siddons Future Proof", "David Siddons", "Cell 5", "planned", "2026-10-01", "2027-10-01", [], undefined, ["noBudget"]),

  P("422.01", "Deiman: E-commerce", "Deiman", "Cell 6", "completed", "2026-04-15", "2026-07-22", ["DEC"], "deiman"),
  P("422.02", "Deiman: Future Proof", "Deiman", "Cell 6", "active", "2026-08-24", "2027-04-15", [], "deiman"),
  P("431.01", "Standard Metrics", "Standard Metrics", "Cell 6", "completed", "2026-06-15", "2026-06-30", ["STAN"], undefined, ["noBudget"]),

  P("219.01", "bluepixel.mx", "BluePixel", "Cell 7", "inactive", "2022-10-27", "2027-12-31", ["BM2", "PB"], undefined, ["internal"]),
  P("401.01", "David Siddons Web Module", "David Siddons", "Cell 7", "active", "2025-12-17", "2026-03-13", ["DS"]),
  P("419.01", "Eximware UX/UI 2026", "Eximware", "Cell 7", "completed", "2026-02-17", "2026-05-01", ["EU2"], "eximware", ["noBudget"]),
  P("431.02", "Standard & Metrics: on demand", "Standard Metrics", "Cell 7", "active", "2026-09-01", "2026-10-30", ["STAN"]),
  P("433.01", "Eximware Cata", "Eximware", "Cell 7", "active", "2026-07-20", "2026-11-14", ["ED"], "eximware"),

  P("397.02", "Bimbo: Célula Dev", "Bimbo", "Cell 9", "active", "2025-09-08", "2026-06-30", ["BIM"]),
  P("397.03", "Bimbo: Recurso Diseño (Dic 25-Dic 26)", "Bimbo", "Cell 9", "active", "2025-12-01", "2026-12-31", ["BFD2", "BIMFD"]),

  P("284.01", "Ikichu", "Ikichu", "Cell 10", "inactive", "2023-09-14", "2026-09-30", ["KCH"], undefined, ["internal"]),
  P("410.02", "S. Gimenez: Fundación", "S. Gimenez", "Cell 10", "paused", "2026-10-01", "2026-12-01", ["SGF", "SGMP"]),
  P("416.01", "FMF 2026: Rediseño Sitio Liga Mx", "FMF", "Cell 10", "inactive", "2026-02-19", "2026-07-03", ["FMFRL"], "fmf", ["noBudget"]),
  P("423.01", "Arcadia / Quantit", "Arcadia", "Cell 10", "inactive", "2026-10-01", "2027-01-22", ["KA", "KACM", "KAYP"], undefined, ["noBudget"]),

  P("397.04", "Bimbo: Recurso Agosto 2026", "Bimbo", "Cell 12", "active", "2026-08-31", "2026-11-30"),
  P("0000.x2", "Talent Hub", "BluePixel", "Cell 13", "inactive", "2026-11-05", "2027-02-11"),

  P("261.01", "Magenta rwds", "Magenta", "Cell DevOps", "inactive", "2024-01-29", "2025-11-28", ["MAG"], undefined, ["noBudget"]),
  P("333.04", "Fiesta Americana 2026- Soporte 60 hrs", "Fiesta Americana", "Cell DevOps", "inactive", "2026-03-04", "2027-03-04", ["GFA"]),
  P("361.01", "VTO Soporte y Mantenimiento 2025", "VTO", "Cell DevOps", "inactive", "2025-01-01", "2026-12-31", ["VSYM"]),
  P("414.01", "Bimbo USA 2026 (Hosting)", "Bimbo", "Cell DevOps", "active", "2025-12-01", "2026-12-31", ["BMBU"], undefined, ["noBudget"]),
  P("414.02", "Bimbo USA 2026 (Soporte)", "Bimbo", "Cell DevOps", "active", "2025-12-01", "2026-12-31", ["BMBU"]),
  P("415.01", "Naturgy Personal e Industrial + Canalacerca 2026", "Naturgy", "Cell DevOps", "active", "2026-05-01", "2026-12-31", ["NAT2026"]),
  P("425.01", "Beach Butler 2026: Soporte y Mantenimiento", "Beach Butler", "Cell DevOps", "inactive", "2026-01-01", "2026-12-31", ["BB"]),
  P("425.02", "Beach Butler 2026: Renta", "Beach Butler", "Cell DevOps", "inactive", "2026-01-01", "2026-12-31", ["BB"], undefined, ["noBudget"]),
  P("430.01", "Herdez Soporte", "Herdez", "Cell DevOps", "inactive", "2026-06-04", "2026-10-31", ["HER", "HS3M"]),

  P("1000.05", "Tossu", "Tossu", "Célula 11", "active", "2026-07-30", "2026-11-30", ["TOS"]),
  P("0000.x1", "Eximware PMX5", "Eximware", "Estratega 1", "planned", "2026-11-16", "2027-01-08", [], "eximware"),
  P("999.02", "QA Center", "BluePixel", "QA", "inactive", "2026-10-05", "2026-12-31", ["PQT"], undefined, ["internal"]),

  P("413.01", "Hogares Unión (Fase 1 Definición)", "Hogares Unión", "Squad 1 (HU)", "completed", "2026-02-09", "2026-03-16", ["HUF1D"], "hogares-union", ["noBudget"]),
  P("413.02", "Hogares Unión (Fase 2 Create)", "Hogares Unión", "Squad 1 (HU)", "completed", "2026-03-16", "2026-10-18", ["HUF2C"], "hogares-union"),
  P("413.03", "Hogares Unión (Fase 3 Future Proof)", "Hogares Unión", "Squad 1 (HU)", "active", "2026-10-19", "2026-12-31", ["HUF3FP"], "hogares-union"),
  P("413.0X", "Hogares Unión (Fase 2.5)", "Hogares Unión", "Squad 1 (HU)", "planned", "2027-01-04", "2027-08-16", [], "hogares-union"),
  P("413.0X", "Hogares Unión (Gestor de Citas)", "Hogares Unión", "Squad 1 (HU)", "planned", "2026-11-01", "2027-04-25", [], "hogares-union"),
];

/**
 * Who works on each project, by tracker code (or "code" + name where the code is shared). `why` says what the assignment is based on,
 * from strongest to weakest: the Jira board the person owns, the tickets they create (strategists are the product owners who write
 * the tickets; developers are the assignees), tickets assigned to them, and the account's team. Evidence checked in Jira on 2026-11-02
 * over the last 365 days. `provisional` means nobody in the team has any Jira activity on that project, so it was placed by the cell
 * and the client's family and needs confirming — Admin can change it.
 */
export interface Assignment {
  code: string;
  /** Needed only when two projects share a code. */
  name?: string;
  why: string;
  provisional?: boolean;
}

const BOARD = "Tablero de Jira configurado";
const ACCOUNT = "Equipo de la cuenta (correos de QA y encuestas)";
const creates = (what: string) => `Crea los tickets de ${what} en Jira`;
const HU = (why: string): Assignment[] => [
  { code: "413.01", why },
  { code: "413.02", why },
  { code: "413.03", why },
  { code: "413.0X", name: "Hogares Unión (Fase 2.5)", why },
  { code: "413.0X", name: "Hogares Unión (Gestor de Citas)", why },
];
/** For projects with no Jira activity from the team at all. */
const guess = (code: string, reason: string, name?: string): Assignment => ({ code, name, why: `Provisional · ${reason} · por confirmar`, provisional: true });

export const ASSIGNMENTS: Record<string, Assignment[]> = {
  "johanna-quiroga": [
    { code: "347.03", why: `${BOARD} · ${creates("Cemex")} (214)` },
    { code: "420.01", why: `${BOARD} · ${creates("APAC")} (170)` },
    { code: "421.01", why: ACCOUNT },
    { code: "426.00", why: creates("PMI") },
    { code: "426.01", why: `${creates("PMI Colombia")} (63)` },
    { code: "426.02", why: creates("PMI") },
    { code: "427.01", why: creates("PMI") },
    { code: "432.01", why: `${creates("Together Club")} (40)` },
    { code: "435.01", why: `${creates("PMI")} (7)` },
    { code: "415.01", why: `${creates("Naturgy")} (38)` },
    guess("261.03", "misma célula que PMI, sin actividad de estrategas en Jira"),
    guess("261.01", "mismo cliente que Magenta Nuevos Requerimientos"),
  ],
  "lucero-cervantes": [
    { code: "420.01", why: BOARD },
    { code: "421.01", why: ACCOUNT },
    { code: "284.01", why: `${BOARD} · ${creates("Ikichu")} (31)` },
    { code: "416.01", why: `${BOARD} · tickets asignados (25)` },
  ],
  camila: [
    { code: "386.01", why: `${creates("Peakland")} (122)` },
    { code: "372.02", why: `${creates("Aquí hay trabajo")} (más de 800)` },
    { code: "372.05", why: ACCOUNT },
    { code: "422.01", why: `${BOARD} · ${creates("Deiman")} (81)` },
    { code: "422.02", why: ACCOUNT },
    { code: "416.01", why: BOARD },
  ],
  "alexis-aguilar": [
    { code: "395.01", why: "Tickets asignados en Jira (31)" },
    { code: "395.02", why: `${BOARD} · ${creates("Transpais")} (85)` },
    { code: "395.03", why: ACCOUNT },
    { code: "377.04", why: `${BOARD} · ${creates("Kumpel")} (130)` },
    { code: "284.01", why: BOARD },
  ],
  "jorge-de-buen": [
    { code: "1000.05", why: `${BOARD} · ${creates("Tossu")} (124)` },
    { code: "386.01", why: `${BOARD} · ${creates("Peakland interno")} (32)` },
    guess("219.01", "proyecto interno de web; Head of UX"),
    guess("999.02", "proyecto interno de calidad"),
  ],
  "daniel-gamboa": [
    { code: "416.01", why: `${BOARD} · tickets asignados (42)` },
    { code: "433.01", why: `${BOARD} · ${creates("Eximware")} (104)` },
    { code: "419.01", why: "Tickets asignados en Jira (6)" },
    { code: "0000.x1", why: ACCOUNT },
  ],
  "adriana-ruiz": HU(ACCOUNT),
  "luis-rodriguez": HU(ACCOUNT),
  "montserrat-hernandez": [
    guess("397.02", "familia Bimbo, sin actividad de estrategas en Jira"),
    guess("397.03", "familia Bimbo"),
    guess("397.04", "familia Bimbo"),
    guess("414.01", "familia Bimbo"),
    guess("414.02", "familia Bimbo"),
    guess("333.04", "soporte, sin actividad de estrategas en Jira"),
    guess("361.01", "soporte, sin actividad de estrategas en Jira"),
    guess("423.01", "sin actividad de estrategas en Jira"),
  ],
  "daniel-morfin": [
    guess("425.01", "familia Beach Butler, sin actividad de estrategas en Jira"),
    guess("425.02", "familia Beach Butler"),
    guess("430.01", "soporte, sin actividad de estrategas en Jira"),
    guess("431.01", "familia Standard Metrics, sin actividad de estrategas en Jira"),
    guess("431.02", "familia Standard Metrics"),
    guess("401.01", "familia David Siddons, sin actividad de estrategas en Jira"),
    guess("401.02", "familia David Siddons"),
    guess("0000.x2", "proyecto nuevo sin tickets todavía"),
  ],
};

/** Jira keys a person's board has besides the ones of their assigned projects (work that isn't in the tracker). Vacations/absences and business tasks are not projects and never go here. */
const EXTRA_BOARD_KEYS: Record<string, string[]> = {
  "daniel-gamboa": ["PMIMXS"],
  "jorge-de-buen": ["PI"],
};

/** Strategists whose deadlines come from Jira. The rest type them by hand in Admin (see the sources in strategists.ts). */
export function boardKeysFor(strategistId: string): string[] {
  const keys = new Set(EXTRA_BOARD_KEYS[strategistId] ?? []);
  for (const a of ASSIGNMENTS[strategistId] ?? []) {
    if (a.provisional) continue;
    for (const k of find(a).jiraKeys) keys.add(k);
  }
  return [...keys];
}

function find(a: Assignment): CatalogProject {
  const hit = PROJECT_CATALOG.find((p) => p.code === a.code && (!a.name || p.name === a.name));
  if (!hit) throw new Error(`Proyecto no está en el catálogo: ${a.code}`);
  return hit;
}

const STATUS_ORDER: Record<ProjectStatus, number> = { active: 0, planned: 1, paused: 2, completed: 3, inactive: 4 };

/** The projects assigned to a strategist as the profile and Admin store them, active ones first. */
export function projectAssignmentsFor(strategistId: string): ProjectAssignment[] {
  return (ASSIGNMENTS[strategistId] ?? [])
    .map((a) => ({ a, p: find(a) }))
    .sort((x, y) => STATUS_ORDER[x.p.status] - STATUS_ORDER[y.p.status] || y.p.end.localeCompare(x.p.end))
    .map(({ a, p }) => ({
      id: `${p.code}${p.name ? `-${p.name}` : ""}`.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/-+$/g, ""),
      projectName: p.name,
      client: p.client,
      role: "Estratega",
      startDate: p.start,
      endDate: p.end,
      notes: a.why,
      code: p.code,
      cell: p.cell,
      status: p.status,
    }));
}

/** Account → strategists, taken from who is assigned to that account's projects. Null when the account has no project in the catalog. */
export function accountOwnersFromProjects(accountKey: string): string[] | null {
  const projects = PROJECT_CATALOG.filter((p) => p.account === accountKey);
  if (projects.length === 0) return null;
  const owners = new Set<string>();
  for (const [id, list] of Object.entries(ASSIGNMENTS)) if (list.some((a) => find(a).account === accountKey)) owners.add(id);
  return [...owners];
}
