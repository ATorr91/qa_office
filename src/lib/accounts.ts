// Catalog of client accounts that show up in the QA status emails, the NPS surveys (Figma) and the CSAT sheet,
// and which strategists own each one. Scores are collected per account; this is what turns them into
// per-strategist numbers. Owners come from who receives each account's weekly QA email, the team named in
// its NPS survey and the Jira boards configured in Admin. When an account has projects in the project catalog, its team is
// whoever is assigned to those projects (projectCatalog.ts), so QA/NPS/CSAT always follow the same assignments as the profiles.
import { accountOwnersFromProjects } from "./projectCatalog";
import type { Strategist } from "./strategists";

export interface Account {
  key: string;
  name: string;
  /** Normalized fragments (see normalizeName): a project name matches when it contains any of them. */
  aliases: string[];
  strategists: string[];
}

const BASE_ACCOUNTS: Account[] = [
  { key: "cemex", name: "Cemex", aliases: ["cemex"], strategists: ["johanna-quiroga"] },
  { key: "apac", name: "APAC", aliases: ["apac"], strategists: ["johanna-quiroga", "lucero-cervantes"] },
  { key: "kumpel", name: "Kumpel", aliases: ["kumpel"], strategists: ["alexis-aguilar"] },
  { key: "transpais", name: "Transpaís", aliases: ["transpais"], strategists: ["alexis-aguilar"] },
  { key: "eximware", name: "Eximware", aliases: ["eximware"], strategists: ["daniel-gamboa"] },
  { key: "deiman", name: "Deiman", aliases: ["deiman"], strategists: ["camila"] },
  { key: "peak", name: "PEAK", aliases: ["peak"], strategists: ["jorge-de-buen"] },
  { key: "hogares-union", name: "Hogares Unión", aliases: ["hogaresunion"], strategists: ["luis-rodriguez", "adriana-ruiz"] },
  { key: "fmf", name: "FMF Liga MX", aliases: ["fmf"], strategists: ["daniel-gamboa", "lucero-cervantes", "camila"] },
  { key: "sales-train", name: "Sales Train", aliases: ["salestrain"], strategists: ["alexis-aguilar"] },
  { key: "fieldedge", name: "FieldEdge", aliases: ["fieldedge"], strategists: [] },
  { key: "aht", name: "AHT", aliases: ["aht"], strategists: ["camila"] },
];

export const ACCOUNTS: Account[] = BASE_ACCOUNTS.map((a) => ({ ...a, strategists: accountOwnersFromProjects(a.key) ?? a.strategists }));

/** Lowercase, no accents, letters and digits only: "Hogares Unión" → "hogaresunion". */
export function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** The catalog account a free-text project/client name belongs to, or null when it isn't one we track. */
export function findAccount(name: string): Account | null {
  const n = normalizeName(name);
  if (n === "") return null;
  return ACCOUNTS.find((a) => a.aliases.some((alias) => n.includes(alias))) ?? null;
}

export function accountByKey(key: string): Account | null {
  return ACCOUNTS.find((a) => a.key === key) ?? null;
}

export function strategistsOfAccount(key: string, roster: readonly Strategist[]): Strategist[] {
  const owners = new Set(accountByKey(key)?.strategists ?? []);
  return roster.filter((s) => owners.has(s.id));
}
