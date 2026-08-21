// Server-only Google Sheets client for the weekly bitácoras tracker. Never import this from a
// "use client" component — it reads the service account private key from the environment and
// must not reach the browser bundle.
import "server-only";

import { JWT } from "google-auth-library";
import { monthKey, monthsInYear, type MonthKey, type Strategist } from "@/lib/strategists";

export interface BitacoraMonthCount {
  expected: number;
  submitted: number;
  lastDate: string | null;
}

export type BitacorasByStrategistId = Record<string, Partial<Record<MonthKey, BitacoraMonthCount>>>;

export interface BitacorasSyncResult {
  configured: boolean;
  error: string | null;
  fetchedAt: string;
  byStrategistId: BitacorasByStrategistId;
  /** Rows in the sheet whose "Estratega" name didn't match anyone in the current roster. */
  unmatchedNames: string[];
  /** Strategists forced to 100% with a "no aplica" note — bitácora tracking doesn't apply to them right now. */
  notApplicableIds: string[];
}

// These two don't do weekly bitácoras right now — by explicit decision, treat them as fully
// compliant with a "no aplica" note instead of showing "sin información" for every period.
const NOT_APPLICABLE_STRATEGIST_IDS = ["lucero-cervantes", "montserrat-hernandez"];

interface GoogleCreds {
  email: string;
  privateKey: string;
  sheetId: string;
  sheetTab: string;
  trackingStartDate: string;
}

// Bitácora tracking in the sheet only became mandatory as of the last week of July 2026 — earlier
// weeks shouldn't count as "expected", or people simply weren't required to log yet get penalized.
const DEFAULT_TRACKING_START_DATE = "2026-07-31";

function readCreds(): GoogleCreds | null {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!email || !rawKey || !sheetId) return null;
  return {
    email,
    privateKey: rawKey.replace(/\\n/g, "\n"),
    sheetId,
    sheetTab: process.env.GOOGLE_BITACORAS_SHEET_TAB || "Bitácora",
    trackingStartDate: process.env.GOOGLE_BITACORAS_START_DATE || DEFAULT_TRACKING_START_DATE,
  };
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/** A sheet name matches a roster strategist if it's the same name, or the roster name (we may
 * lack a surname) is a leading prefix of the sheet's fuller name. A different surname is NOT a match. */
function matchStrategist(sheetName: string, strategists: Strategist[]): Strategist | null {
  const normSheet = normalize(sheetName);
  if (!normSheet) return null;
  for (const s of strategists) {
    const normRoster = normalize(s.name);
    if (normSheet === normRoster || normSheet.startsWith(`${normRoster} `)) return s;
  }
  return null;
}

const MONTH_NAME_TO_NUM: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
};

/** Extracts the day number from the tail of a week header like "29 jun - 3 jul" or "3-7 ag" (the end date). */
function parseWeekEndDay(header: string): number | null {
  const parts = String(header).split("-");
  const last = parts[parts.length - 1]?.trim() ?? "";
  const m = last.match(/^(\d{1,2})/);
  return m ? Number(m[1]) : null;
}

/**
 * A week only counts as "expected" once it has actually finished (never count a week that
 * hasn't happened yet) AND once tracking had already started (never penalize weeks from before
 * bitácoras were required).
 */
function isWeekCountable(year: number, monthNum: number, endDay: number, nowMs: number, trackingStartDate: string): boolean {
  const endIso = `${year}-${String(monthNum).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;
  if (endIso < trackingStartDate) return false;
  const endMs = new Date(`${endIso}T23:59:59`).getTime();
  return endMs <= nowMs;
}

async function fetchSheetValues(creds: GoogleCreds): Promise<unknown[][]> {
  const client = new JWT({
    email: creds.email,
    key: creds.privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const range = `'${creds.sheetTab}'!A1:Z300`;
  const res = await client.request<{ values?: unknown[][] }>({
    url: `https://sheets.googleapis.com/v4/spreadsheets/${creds.sheetId}/values/${encodeURIComponent(range)}?valueRenderOption=UNFORMATTED_VALUE&majorDimension=ROWS`,
  });
  return res.data.values ?? [];
}

/**
 * Parses the bitácoras sheet: row 0 has merged month-group headers ("Julio", "Agosto", ...),
 * row 1 has per-week date-range sub-headers, columns 0/1 are Estratega/Proyecto, and every
 * column from 2 onward is one week with a checkbox (true/false) per strategist row.
 */
export async function fetchBitacorasSync(strategists: Strategist[], year: number): Promise<BitacorasSyncResult> {
  const fetchedAt = new Date().toISOString();
  const notApplicableIds = NOT_APPLICABLE_STRATEGIST_IDS.filter((id) => strategists.some((s) => s.id === id));
  const trackingStartDate = process.env.GOOGLE_BITACORAS_START_DATE || DEFAULT_TRACKING_START_DATE;
  const trackingStartMonth = Number(trackingStartDate.split("-")[1]);

  function withNotApplicableOverride(byStrategistId: BitacorasByStrategistId): BitacorasByStrategistId {
    for (const id of notApplicableIds) {
      const entries: Partial<Record<MonthKey, BitacoraMonthCount>> = {};
      // Only mark them "no aplica" for months tracking actually covers — not the whole year.
      for (const mk of monthsInYear(year)) {
        if (Number(mk.split("-")[1]) >= trackingStartMonth) entries[mk] = { expected: 1, submitted: 1, lastDate: null };
      }
      byStrategistId[id] = entries;
    }
    return byStrategistId;
  }

  const creds = readCreds();
  if (!creds) {
    return { configured: false, error: null, fetchedAt, byStrategistId: withNotApplicableOverride({}), unmatchedNames: [], notApplicableIds };
  }

  try {
    const rows = await fetchSheetValues(creds);
    if (rows.length < 3) {
      return { configured: true, error: null, fetchedAt, byStrategistId: withNotApplicableOverride({}), unmatchedNames: [], notApplicableIds };
    }

    const monthHeaderRow = rows[0] ?? [];
    const weekHeaderRow = rows[1] ?? [];
    const dataRows = rows.slice(2);

    const monthForColumn: (number | null)[] = [];
    let currentMonth: number | null = null;
    for (let c = 0; c < weekHeaderRow.length; c++) {
      const raw = (monthHeaderRow[c] ?? "").toString().trim();
      if (raw) {
        const num = MONTH_NAME_TO_NUM[normalize(raw)];
        if (num) currentMonth = num;
      }
      monthForColumn[c] = c < 2 ? null : currentMonth;
    }

    const byStrategistId: BitacorasByStrategistId = {};
    const unmatchedNames: string[] = [];
    const nowMs = Date.now();

    for (const row of dataRows) {
      const name = (row[0] ?? "").toString().trim();
      if (!name) continue;
      const strategist = matchStrategist(name, strategists);
      if (!strategist) {
        unmatchedNames.push(name);
        continue;
      }

      const perMonth: Partial<Record<MonthKey, { expected: number; submitted: number; lastDay: number }>> = {};
      for (let c = 2; c < weekHeaderRow.length; c++) {
        const monthNum = monthForColumn[c];
        if (!monthNum) continue;
        const endDay = parseWeekEndDay(String(weekHeaderRow[c] ?? ""));
        if (!endDay || !isWeekCountable(year, monthNum, endDay, nowMs, creds.trackingStartDate)) continue;

        const mk = monthKey(year, monthNum);
        const bucket = (perMonth[mk] ??= { expected: 0, submitted: 0, lastDay: 0 });
        bucket.expected += 1;
        const checked = row[c] === true;
        if (checked) {
          bucket.submitted += 1;
          if (endDay > bucket.lastDay) bucket.lastDay = endDay;
        }
      }

      byStrategistId[strategist.id] = Object.fromEntries(
        Object.entries(perMonth)
          .filter((entry): entry is [string, { expected: number; submitted: number; lastDay: number }] => entry[1] !== undefined)
          .map(([mk, v]) => [
            mk,
            { expected: v.expected, submitted: v.submitted, lastDate: v.lastDay > 0 ? `${mk}-${String(v.lastDay).padStart(2, "0")}` : null },
          ]),
      );
    }

    return { configured: true, error: null, fetchedAt, byStrategistId: withNotApplicableOverride(byStrategistId), unmatchedNames, notApplicableIds };
  } catch (err) {
    return {
      configured: true,
      error: err instanceof Error ? err.message : "Error desconocido al conectar con Google Sheets.",
      fetchedAt,
      byStrategistId: withNotApplicableOverride({}),
      unmatchedNames: [],
      notApplicableIds,
    };
  }
}
