// Server-only: reading and writing the `external_scores` table, plus the shared-secret check for the endpoints
// that automations (Google Apps Script, Vercel cron) call. Never import from a "use client" component.
import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import type { Pool } from "pg";
import { findAccount, normalizeName } from "./accounts";
import { ensureSchema } from "./db";
import { aggregateScores, type ExternalScoresResponse, type ScoreRow, type ScoreSource } from "./externalScores";

export interface ScoreInput {
  source: ScoreSource;
  ref: string;
  account: string;
  period: string;
  data: Record<string, unknown>;
}

export class IngestError extends Error {}

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const MAX_ROWS = 500;

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

/** True when the request carries `Authorization: Bearer <secret>` for INGEST_SECRET or CRON_SECRET (Vercel cron sends the latter). */
export function hasAutomationSecret(request: NextRequest): boolean {
  const header = request.headers.get("authorization") ?? "";
  const sent = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (sent === "") return false;
  return [process.env.INGEST_SECRET, process.env.CRON_SECRET].some((secret) => !!secret && timingSafeEqual(digest(sent), digest(secret)));
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function text(v: unknown, label: string, max = 200): string {
  if (typeof v !== "string" || v.trim() === "") throw new IngestError(`${label} es obligatorio.`);
  if (v.length > max) throw new IngestError(`${label} es demasiado largo.`);
  return v.trim();
}

function optionalText(v: unknown, max = 200): string | null {
  return typeof v === "string" && v.trim() !== "" ? v.trim().slice(0, max) : null;
}

function numberIn(v: unknown, label: string, min: number, max: number): number {
  if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max) throw new IngestError(`${label} debe ser un número entre ${min} y ${max}.`);
  return v;
}

function optionalNumberIn(v: unknown, label: string, min: number, max: number): number | null {
  return v === null || v === undefined ? null : numberIn(v, label, min, max);
}

/**
 * The report's cut date. The email body is trusted unless it can't be right: not a real date, after the day the
 * email was sent, or day and month swapped ("2026-09-10" in an email sent on 2026-10-09). Falls back to the sent date.
 */
export function resolveCutDate(cutDate: string | null, emailDate: string | null): string | null {
  const sent = emailDate && DATE_RE.test(emailDate) ? emailDate : null;
  if (!cutDate || !DATE_RE.test(cutDate)) return sent;
  if (!sent) return cutDate;
  const limit = Date.parse(sent) + 86_400_000;
  const [y, a, b] = cutDate.split("-");
  const swapped = `${y}-${b}-${a}`;
  const candidates = [cutDate, swapped].filter((d) => DATE_RE.test(d) && Date.parse(d) <= limit);
  if (candidates.length === 0) return sent;
  return candidates.sort((x, z) => Math.abs(Date.parse(sent) - Date.parse(x)) - Math.abs(Date.parse(sent) - Date.parse(z)))[0];
}

function parseComments(v: unknown): { text: string; score: number | null; scale: 5 | 10 | null; section: "proyecto" | "empresa" }[] {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v) || v.length > 40) throw new IngestError("comments debe ser una lista de hasta 40 elementos.");
  return v.map((c) => {
    if (!isObject(c)) throw new IngestError("Un comentario no es válido.");
    const text = text_(c.text);
    return { text, score: optionalNumberIn(c.score, "score", 0, 10), scale: c.scale === 5 || c.scale === 10 ? c.scale : null, section: c.section === "empresa" ? ("empresa" as const) : ("proyecto" as const) };
  });
}

function text_(v: unknown): string {
  if (typeof v !== "string" || v.trim() === "") throw new IngestError("Un comentario viene vacío.");
  return v.trim().slice(0, 1200);
}

function accountKey(name: string): string {
  return findAccount(name)?.key ?? normalizeName(name);
}

/** Validates a batch from an automation and turns it into rows keyed so re-sending the same data never duplicates it. */
export function parseIngest(source: string, body: unknown): ScoreInput[] {
  if (!isObject(body) || !Array.isArray(body.rows)) throw new IngestError("Se esperaba { rows: [...] }.");
  if (body.rows.length === 0 || body.rows.length > MAX_ROWS) throw new IngestError(`Envía entre 1 y ${MAX_ROWS} filas.`);

  return body.rows.flatMap((raw, i): ScoreInput[] => {
    if (!isObject(raw)) throw new IngestError(`La fila ${i + 1} no es válida.`);

    if (source === "qa") {
      const project = text(raw.project, "project");
      const passRate = numberIn(raw.passRate, "passRate", 0, 100);
      const cutDate = resolveCutDate(optionalText(raw.cutDate, 20), optionalText(raw.emailDate, 40)?.slice(0, 10) ?? null);
      if (!cutDate) throw new IngestError(`La fila ${i + 1} no tiene una fecha de corte válida.`);
      const account = accountKey(project);
      const release = optionalText(raw.release, 60);
      return [
        {
          source: "qa",
          ref: `${account}|${cutDate}|${normalizeName(release ?? "")}`,
          account,
          period: cutDate.slice(0, 7),
          data: { project, release, cutDate, progress: optionalNumberIn(raw.progress, "progress", 0, 100), passRate, status: optionalText(raw.status, 40) },
        },
      ];
    }

    if (source === "nps") {
      const project = text(raw.project, "project");
      const surveyDate = text(raw.surveyDate, "surveyDate", 10);
      if (!DATE_RE.test(surveyDate)) throw new IngestError(`La fila ${i + 1} tiene una fecha de encuesta inválida.`);
      const account = accountKey(project);
      return [
        {
          source: "nps",
          ref: text(raw.ref, "ref"),
          account,
          period: surveyDate.slice(0, 7),
          data: {
            project,
            surveyDate,
            answer: optionalNumberIn(raw.answer, "answer", 0, 10),
            rating: optionalNumberIn(raw.rating, "rating", 1, 5),
            ratingDerived: raw.ratingDerived === true,
            comments: parseComments(raw.comments),
          },
        },
      ];
    }

    if (source === "csat") {
      // Only per-client monthly averages are stored — never the individual answers or who gave them.
      const client = text(raw.client, "client");
      const month = text(raw.month, "month", 7);
      if (!MONTH_RE.test(month)) throw new IngestError(`La fila ${i + 1} tiene un mes inválido.`);
      const scaleMax = numberIn(raw.scaleMax, "scaleMax", 1, 100);
      if (!Array.isArray(raw.values)) throw new IngestError(`La fila ${i + 1} no trae values.`);
      const values = raw.values.map((v) => numberIn(v, "values", 0, scaleMax));
      // Clients that aren't one of the tracked accounts are dropped here, so their names never reach the database.
      const known = findAccount(client);
      if (values.length === 0 || !known) return [];
      const account = known.key;
      const avg = (values.reduce((a, b) => a + b, 0) / values.length / scaleMax) * 100;
      return [{ source: "csat", ref: `${account}|${month}`, account, period: month, data: { avg, responses: values.length } }];
    }

    throw new IngestError("Fuente desconocida.");
  });
}

/** Inserts or updates rows. Rows saved by hand (origin 'manual') are only overwritten by another manual save, never by an automatic sync. */
export async function upsertScores(pool: Pool, rows: ScoreInput[], origin: "sync" | "manual"): Promise<number> {
  await ensureSchema(pool);
  const client = await pool.connect();
  try {
    await client.query("begin");
    for (const r of rows) {
      await client.query(
        `insert into external_scores (source, ref, account, period, data, origin) values ($1, $2, $3, $4, $5, $6)
         on conflict (source, ref) do update
           set account = excluded.account, period = excluded.period, data = excluded.data, origin = excluded.origin, updated_at = now()
           where external_scores.origin <> 'manual' or excluded.origin = 'manual'`,
        [r.source, r.ref, r.account, r.period, JSON.stringify(r.data), origin],
      );
    }
    await client.query("commit");
    return rows.length;
  } catch (err) {
    await client.query("rollback").catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

export async function readScores(pool: Pool): Promise<ExternalScoresResponse> {
  await ensureSchema(pool);
  const { rows } = await pool.query<{ source: ScoreSource; ref: string; account: string; period: string; data: Record<string, unknown>; updated_at: Date }>(
    "select source, ref, account, period, data, updated_at from external_scores",
  );
  const scoreRows: ScoreRow[] = rows.map((r) => ({ source: r.source, ref: r.ref, account: r.account, period: r.period, data: r.data, updatedAt: r.updated_at.toISOString() }));
  return { configured: true, error: null, fetchedAt: new Date().toISOString(), ...aggregateScores(scoreRows) };
}
