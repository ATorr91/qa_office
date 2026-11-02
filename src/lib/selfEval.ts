// Server-only engine for the strategists' self-evaluation surveys: creating and scheduling them, emailing the
// invitations and reminders, taking the answers, closing on time and repeating monthly. Emails are never sent from here
// directly — they go into `email_outbox`, which is delivered by Resend (if RESEND_API_KEY is set) or by the Google Apps
// Script worker, so nothing is sent unless one of those is configured.
import "server-only";

import { randomBytes, randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { ensureSchema } from "./db";
import { invitationMail, reminderMail, type MailContent } from "./selfEvalMail";
import {
  DEFAULT_REMINDER_HOURS,
  DEFAULT_WINDOW_HOURS,
  RATING_MAX,
  type CreateSurveyInput,
  type InviteDetail,
  type MailStatus,
  type SelfEvalAnswers,
  type SelfEvalQuestion,
  type SurveyAction,
  type SurveyDetail,
  type SurveyEvent,
  type SurveyStatus,
  type SurveySummary,
} from "./selfEvalTypes";
import { STRATEGISTS } from "./strategists";

export class SelfEvalError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

type Db = Pool | PoolClient;
const HOUR = 3_600_000;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const KNOWN_IDS = new Set(STRATEGISTS.map((s) => s.id));

/** Public base URL for the links in the emails. */
export function appBaseUrl(requestOrigin?: string | null): string {
  const fromEnv = process.env.APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (requestOrigin) return requestOrigin.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return vercel ? `https://${vercel}` : "https://qa-office.vercel.app";
}

function iso(d: Date | null): string | null {
  return d ? d.toISOString() : null;
}

async function logEvent(db: Db, surveyId: string, strategistId: string | null, type: string, detail = ""): Promise<void> {
  await db.query("insert into self_eval_events (survey_id, strategist_id, type, detail) values ($1, $2, $3, $4)", [surveyId, strategistId, type, detail]);
}

async function enqueue(db: Db, mail: MailContent, kind: string, to: string, surveyId: string, strategistId: string): Promise<void> {
  await db.query(
    "insert into email_outbox (kind, to_email, subject, html, body, survey_id, strategist_id) values ($1, $2, $3, $4, $5, $6, $7)",
    [kind, to, mail.subject, mail.html, mail.text, surveyId, strategistId],
  );
}

const firstName = (strategistId: string) => STRATEGISTS.find((s) => s.id === strategistId)?.name.split(" ")[0] ?? "";
const linkFor = (baseUrl: string, token: string) => `${baseUrl}/autoevaluacion/${token}`;

// ---------- validation ----------

function validateQuestions(raw: unknown): SelfEvalQuestion[] {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 30) throw new SelfEvalError("La encuesta necesita entre 1 y 30 preguntas.");
  const seen = new Set<string>();
  return raw.map((q, i) => {
    const o = q as Partial<SelfEvalQuestion>;
    const label = typeof o.label === "string" ? o.label.trim() : "";
    if (!label || label.length > 300) throw new SelfEvalError(`La pregunta ${i + 1} necesita un texto de hasta 300 caracteres.`);
    if (o.type !== "rating" && o.type !== "text") throw new SelfEvalError(`La pregunta ${i + 1} tiene un tipo no válido.`);
    const id = typeof o.id === "string" && /^[a-z0-9_-]{1,40}$/i.test(o.id) ? o.id : `q${i + 1}`;
    if (seen.has(id)) throw new SelfEvalError(`La pregunta ${i + 1} repite un id.`);
    seen.add(id);
    const dimension = o.type === "rating" && o.dimension ? o.dimension : null;
    return { id, type: o.type, label, dimension, required: o.required === true };
  });
}

function validateCreate(input: CreateSurveyInput) {
  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (!title || title.length > 120) throw new SelfEvalError("El título es obligatorio (máximo 120 caracteres).");
  if (typeof input.period !== "string" || !MONTH_RE.test(input.period)) throw new SelfEvalError("El periodo no es válido.");
  const questions = validateQuestions(input.questions);
  if (!Array.isArray(input.recipients) || input.recipients.length === 0) throw new SelfEvalError("Elige al menos a una persona.");
  const recipients = input.recipients.map((r) => {
    if (!KNOWN_IDS.has(r.strategistId)) throw new SelfEvalError("Hay un estratega desconocido en la lista.");
    if (!EMAIL_RE.test(r.email)) throw new SelfEvalError(`El correo de ${firstName(r.strategistId)} no es válido.`);
    return { strategistId: r.strategistId, email: r.email.trim().toLowerCase() };
  });
  if (new Set(recipients.map((r) => r.strategistId)).size !== recipients.length) throw new SelfEvalError("Una persona está repetida.");
  const windowHours = Number(input.windowHours);
  if (!Number.isFinite(windowHours) || windowHours < 1 || windowHours > 168) throw new SelfEvalError("El plazo debe estar entre 1 y 168 horas.");
  const reminderHours = [...new Set((input.reminderHours ?? []).map(Number))]
    .filter((h) => Number.isFinite(h) && h > 0 && h < windowHours)
    .sort((a, b) => b - a)
    .slice(0, 5);
  let sendAt: Date | null = null;
  if (input.sendAt) {
    sendAt = new Date(input.sendAt);
    if (Number.isNaN(sendAt.getTime())) throw new SelfEvalError("La fecha de envío no es válida.");
  }
  return { title, period: input.period, questions, recipients, windowHours, reminderHours, sendAt, repeatMonthly: input.repeatMonthly === true };
}

// ---------- creating, opening, closing ----------

export async function createSurvey(pool: Pool, input: CreateSurveyInput, baseUrl: string, now = new Date()): Promise<string> {
  await ensureSchema(pool);
  const v = validateCreate(input);
  const id = randomUUID();
  const sendNow = v.sendAt === null || v.sendAt.getTime() <= now.getTime();
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(
      `insert into self_eval_surveys (id, title, period, questions, status, send_at, window_hours, reminder_hours, repeat_monthly)
       values ($1, $2, $3, $4, 'scheduled', $5, $6, $7, $8)`,
      [id, v.title, v.period, JSON.stringify(v.questions), v.sendAt ?? now, v.windowHours, JSON.stringify(v.reminderHours), v.repeatMonthly],
    );
    for (const r of v.recipients) {
      await client.query("insert into self_eval_invites (survey_id, strategist_id, email, token, status) values ($1, $2, $3, $4, 'pending')", [
        id,
        r.strategistId,
        r.email,
        randomBytes(24).toString("hex"),
      ]);
    }
    await logEvent(client, id, null, "created", sendNow ? "Se envía de inmediato" : `Programada para ${v.sendAt!.toISOString()}`);
    if (sendNow) await openSurvey(client, id, now, baseUrl);
    await client.query("commit");
  } catch (err) {
    await client.query("rollback").catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
  return id;
}

/** Opens a scheduled survey: starts the response window and queues an invitation for everyone who hasn't got one. */
async function openSurvey(db: Db, surveyId: string, now: Date, baseUrl: string): Promise<void> {
  const { rows } = await db.query<{ title: string; window_hours: number }>("select title, window_hours from self_eval_surveys where id = $1 for update", [surveyId]);
  if (rows.length === 0) throw new SelfEvalError("La encuesta no existe.", 404);
  const closes = new Date(now.getTime() + rows[0].window_hours * HOUR);
  await db.query("update self_eval_surveys set status = 'open', sent_at = $2, closes_at = $3 where id = $1", [surveyId, now, closes]);
  const invites = await db.query<{ strategist_id: string; email: string; token: string }>(
    "select strategist_id, email, token from self_eval_invites where survey_id = $1 and status = 'pending'",
    [surveyId],
  );
  for (const inv of invites.rows) {
    await enqueue(db, invitationMail({ name: firstName(inv.strategist_id), title: rows[0].title, link: linkFor(baseUrl, inv.token), closesAt: closes.toISOString(), windowHours: rows[0].window_hours }), "invitation", inv.email, surveyId, inv.strategist_id);
    await db.query("update self_eval_invites set status = 'sent', sent_at = $3 where survey_id = $1 and strategist_id = $2", [surveyId, inv.strategist_id, now]);
    await logEvent(db, surveyId, inv.strategist_id, "invitation", `Invitación en cola para ${inv.email}`);
  }
}

/** Closes a survey; whoever didn't answer is marked as having no response. Repeats monthly when asked. */
async function closeSurvey(db: Db, surveyId: string, reason: string): Promise<void> {
  await db.query("update self_eval_surveys set status = 'closed', closes_at = least(coalesce(closes_at, now()), now()) where id = $1 and status = 'open'", [surveyId]);
  const expired = await db.query<{ strategist_id: string }>(
    "update self_eval_invites set status = 'expired' where survey_id = $1 and status in ('pending', 'sent') returning strategist_id",
    [surveyId],
  );
  for (const e of expired.rows) await logEvent(db, surveyId, e.strategist_id, "expired", "No respondió dentro del plazo");
  await logEvent(db, surveyId, null, "closed", reason);
}

async function scheduleNextMonth(db: Db, surveyId: string): Promise<void> {
  const { rows } = await db.query<{ title: string; period: string; questions: SelfEvalQuestion[]; send_at: Date | null; sent_at: Date | null; window_hours: number; reminder_hours: number[]; repeat_monthly: boolean }>(
    "select title, period, questions, send_at, sent_at, window_hours, reminder_hours, repeat_monthly from self_eval_surveys where id = $1",
    [surveyId],
  );
  const s = rows[0];
  if (!s?.repeat_monthly) return;
  const exists = await db.query("select 1 from self_eval_surveys where parent_id = $1", [surveyId]);
  if (exists.rows.length > 0) return;

  const base = s.send_at ?? s.sent_at ?? new Date();
  const next = new Date(base);
  next.setUTCMonth(next.getUTCMonth() + 1);
  const [y, m] = s.period.split("-").map(Number);
  const nextPeriod = `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, "0")}`;
  const newId = randomUUID();
  await db.query(
    `insert into self_eval_surveys (id, title, period, questions, status, send_at, window_hours, reminder_hours, repeat_monthly, parent_id)
     values ($1, $2, $3, $4, 'scheduled', $5, $6, $7, true, $8)`,
    [newId, s.title, nextPeriod, JSON.stringify(s.questions), next, s.window_hours, JSON.stringify(s.reminder_hours), surveyId],
  );
  const recipients = await db.query<{ strategist_id: string; email: string }>("select strategist_id, email from self_eval_invites where survey_id = $1", [surveyId]);
  for (const r of recipients.rows) {
    await db.query("insert into self_eval_invites (survey_id, strategist_id, email, token, status) values ($1, $2, $3, $4, 'pending')", [newId, r.strategist_id, r.email, randomBytes(24).toString("hex")]);
  }
  await logEvent(db, newId, null, "created", "Creada automáticamente por la repetición mensual");
  await logEvent(db, surveyId, null, "repeat", `Se programó la siguiente para ${next.toISOString()}`);
}

// ---------- reading ----------

function toSummary(r: Record<string, unknown>): SurveySummary {
  return {
    id: r.id as string,
    title: r.title as string,
    period: r.period as string,
    status: r.status as SurveyStatus,
    sendAt: iso(r.send_at as Date | null),
    sentAt: iso(r.sent_at as Date | null),
    closesAt: iso(r.closes_at as Date | null),
    windowHours: r.window_hours as number,
    reminderHours: r.reminder_hours as number[],
    repeatMonthly: r.repeat_monthly as boolean,
    createdAt: iso(r.created_at as Date) as string,
    invited: Number(r.invited ?? 0),
    answered: Number(r.answered ?? 0),
  };
}

export async function listSurveys(pool: Pool): Promise<SurveySummary[]> {
  await ensureSchema(pool);
  const { rows } = await pool.query(
    `select s.*, count(i.*) as invited, count(i.*) filter (where i.status = 'answered') as answered
     from self_eval_surveys s left join self_eval_invites i on i.survey_id = s.id
     group by s.id order by coalesce(s.sent_at, s.send_at, s.created_at) desc`,
  );
  return rows.map(toSummary);
}

export async function getSurveyDetail(pool: Pool, id: string): Promise<SurveyDetail> {
  await ensureSchema(pool);
  const s = await pool.query(
    `select s.*, (select count(*) from self_eval_invites where survey_id = s.id) as invited,
            (select count(*) from self_eval_invites where survey_id = s.id and status = 'answered') as answered
     from self_eval_surveys s where s.id = $1`,
    [id],
  );
  if (s.rows.length === 0) throw new SelfEvalError("La encuesta no existe.", 404);
  const [invites, responses, events] = await Promise.all([
    pool.query("select * from self_eval_invites where survey_id = $1 order by strategist_id", [id]),
    pool.query("select strategist_id, answers from self_eval_responses where survey_id = $1", [id]),
    pool.query("select id, strategist_id, type, detail, at from self_eval_events where survey_id = $1 order by at desc, id desc limit 200", [id]),
  ]);
  return {
    survey: { ...toSummary(s.rows[0]), questions: s.rows[0].questions as SelfEvalQuestion[] },
    invites: invites.rows.map(
      (r): InviteDetail => ({
        strategistId: r.strategist_id,
        email: r.email,
        token: r.token,
        status: r.status,
        sentAt: iso(r.sent_at),
        remindersSent: r.reminders_sent,
        lastReminderAt: iso(r.last_reminder_at),
        answeredAt: iso(r.answered_at),
      }),
    ),
    responses: Object.fromEntries(responses.rows.map((r) => [r.strategist_id, r.answers as SelfEvalAnswers])),
    events: events.rows.map((r): SurveyEvent => ({ id: Number(r.id), strategistId: r.strategist_id, type: r.type, detail: r.detail, at: iso(r.at) as string })),
  };
}

export async function mailStatus(pool: Pool): Promise<MailStatus> {
  await ensureSchema(pool);
  const { rows } = await pool.query<{ status: string; n: string }>("select status, count(*) as n from email_outbox where status in ('queued', 'failed') group by status");
  const count = (st: string) => Number(rows.find((r) => r.status === st)?.n ?? 0);
  return { provider: process.env.RESEND_API_KEY ? "resend" : "outbox", queued: count("queued"), failed: count("failed") };
}

// ---------- actions from the admin ----------

export async function runAction(pool: Pool, surveyId: string, action: SurveyAction, strategistId: string | null, baseUrl: string, now = new Date()): Promise<void> {
  await ensureSchema(pool);
  const client = await pool.connect();
  try {
    await client.query("begin");
    const { rows } = await client.query<{ status: SurveyStatus; title: string; window_hours: number; closes_at: Date | null }>(
      "select status, title, window_hours, closes_at from self_eval_surveys where id = $1 for update",
      [surveyId],
    );
    const s = rows[0];
    if (!s) throw new SelfEvalError("La encuesta no existe.", 404);

    if (action === "send-now") {
      if (s.status !== "scheduled") throw new SelfEvalError("Solo se puede enviar una encuesta programada.");
      await openSurvey(client, surveyId, now, baseUrl);
    } else if (action === "cancel") {
      if (s.status === "closed" || s.status === "cancelled") throw new SelfEvalError("Esa encuesta ya terminó.");
      await client.query("update self_eval_surveys set status = 'cancelled', repeat_monthly = false where id = $1", [surveyId]);
      await logEvent(client, surveyId, null, "cancelled", "Cancelada por administración");
    } else if (action === "close") {
      if (s.status !== "open") throw new SelfEvalError("Solo se puede cerrar una encuesta abierta.");
      await closeSurvey(client, surveyId, "Cerrada por administración");
      await scheduleNextMonth(client, surveyId);
    } else if (action === "extend") {
      if (s.status !== "open" && s.status !== "closed") throw new SelfEvalError("Solo se puede extender una encuesta abierta o cerrada.");
      const from = s.closes_at && s.closes_at > now ? s.closes_at : now;
      const closes = new Date(from.getTime() + s.window_hours * HOUR);
      await client.query("update self_eval_surveys set status = 'open', closes_at = $2 where id = $1", [surveyId, closes]);
      // Whoever was marked as having no response gets another chance, and reminders start over.
      await client.query("update self_eval_invites set status = 'sent', reminders_sent = 0 where survey_id = $1 and status = 'expired'", [surveyId]);
      await client.query("update self_eval_invites set reminders_sent = 0 where survey_id = $1 and status = 'sent'", [surveyId]);
      await logEvent(client, surveyId, null, "extended", `Plazo extendido ${s.window_hours} h, cierra ${closes.toISOString()}`);
    } else if (action === "resend" || action === "remind") {
      if (s.status !== "open") throw new SelfEvalError("La encuesta no está abierta.");
      const closes = s.closes_at as Date;
      const targets = await client.query<{ strategist_id: string; email: string; token: string }>(
        `select strategist_id, email, token from self_eval_invites where survey_id = $1 and status in ('pending', 'sent') ${strategistId ? "and strategist_id = $2" : ""}`,
        strategistId ? [surveyId, strategistId] : [surveyId],
      );
      if (targets.rows.length === 0) throw new SelfEvalError("No hay nadie pendiente de responder.");
      for (const t of targets.rows) {
        const link = linkFor(baseUrl, t.token);
        const mail =
          action === "resend"
            ? invitationMail({ name: firstName(t.strategist_id), title: s.title, link, closesAt: closes.toISOString(), windowHours: s.window_hours })
            : reminderMail({ name: firstName(t.strategist_id), title: s.title, link, closesAt: closes.toISOString(), hoursLeft: Math.max(0, (closes.getTime() - now.getTime()) / HOUR) });
        await enqueue(client, mail, action === "resend" ? "invitation" : "reminder", t.email, surveyId, t.strategist_id);
        await client.query("update self_eval_invites set status = 'sent', sent_at = coalesce(sent_at, $3), last_reminder_at = $3 where survey_id = $1 and strategist_id = $2", [surveyId, t.strategist_id, now]);
        await logEvent(client, surveyId, t.strategist_id, action === "resend" ? "invitation" : "reminder", `${action === "resend" ? "Invitación reenviada" : "Recordatorio manual"} en cola para ${t.email}`);
      }
    }
    await client.query("commit");
  } catch (err) {
    await client.query("rollback").catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

// ---------- the strategist's side (by token) ----------

export interface PublicSurvey {
  title: string;
  period: string;
  name: string;
  status: "open" | "closed" | "scheduled" | "cancelled";
  closesAt: string | null;
  questions: SelfEvalQuestion[];
  answers: SelfEvalAnswers | null;
  answeredAt: string | null;
}

export async function surveyByToken(pool: Pool, token: string): Promise<PublicSurvey | null> {
  await ensureSchema(pool);
  if (!/^[a-f0-9]{48}$/.test(token)) return null;
  const { rows } = await pool.query(
    `select i.strategist_id, i.answered_at, s.title, s.period, s.status, s.closes_at, s.questions, r.answers
     from self_eval_invites i join self_eval_surveys s on s.id = i.survey_id
     left join self_eval_responses r on r.survey_id = i.survey_id and r.strategist_id = i.strategist_id
     where i.token = $1`,
    [token],
  );
  const r = rows[0];
  if (!r) return null;
  const closed = r.status === "open" && r.closes_at && new Date(r.closes_at).getTime() <= Date.now();
  return {
    title: r.title,
    period: r.period,
    name: firstName(r.strategist_id),
    status: closed ? "closed" : r.status,
    closesAt: iso(r.closes_at),
    questions: r.questions,
    answers: r.answers ?? null,
    answeredAt: iso(r.answered_at),
  };
}

function validateAnswers(questions: SelfEvalQuestion[], raw: unknown): SelfEvalAnswers {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) throw new SelfEvalError("Las respuestas no son válidas.");
  const input = raw as Record<string, unknown>;
  const out: SelfEvalAnswers = {};
  for (const q of questions) {
    const v = input[q.id];
    const empty = v === undefined || v === null || v === "";
    if (empty) {
      if (q.required) throw new SelfEvalError(`Falta responder: «${q.label}»`);
      continue;
    }
    if (q.type === "rating") {
      const n = Number(v);
      if (!Number.isInteger(n) || n < 1 || n > RATING_MAX) throw new SelfEvalError(`La calificación de «${q.label}» debe ser de 1 a ${RATING_MAX}.`);
      out[q.id] = n;
    } else {
      if (typeof v !== "string") throw new SelfEvalError(`La respuesta de «${q.label}» debe ser texto.`);
      out[q.id] = v.trim().slice(0, 2000);
    }
  }
  return out;
}

/** Saves (or updates, while the window is open) a strategist's answers. */
export async function submitResponse(pool: Pool, token: string, rawAnswers: unknown, now = new Date()): Promise<void> {
  await ensureSchema(pool);
  if (!/^[a-f0-9]{48}$/.test(token)) throw new SelfEvalError("Enlace no válido.", 404);
  const client = await pool.connect();
  try {
    await client.query("begin");
    const { rows } = await client.query(
      `select i.survey_id, i.strategist_id, i.answered_at, s.status, s.closes_at, s.questions
       from self_eval_invites i join self_eval_surveys s on s.id = i.survey_id where i.token = $1 for update of i`,
      [token],
    );
    const r = rows[0];
    if (!r) throw new SelfEvalError("Enlace no válido.", 404);
    if (r.status !== "open" || !r.closes_at || new Date(r.closes_at).getTime() <= now.getTime()) throw new SelfEvalError("Esta encuesta ya cerró.", 410);
    const answers = validateAnswers(r.questions as SelfEvalQuestion[], rawAnswers);
    await client.query(
      `insert into self_eval_responses (survey_id, strategist_id, answers, submitted_at) values ($1, $2, $3, $4)
       on conflict (survey_id, strategist_id) do update set answers = excluded.answers, submitted_at = excluded.submitted_at`,
      [r.survey_id, r.strategist_id, JSON.stringify(answers), now],
    );
    await client.query("update self_eval_invites set status = 'answered', answered_at = $3 where survey_id = $1 and strategist_id = $2", [r.survey_id, r.strategist_id, now]);
    await logEvent(client, r.survey_id, r.strategist_id, r.answered_at ? "updated" : "answered", r.answered_at ? "Actualizó sus respuestas" : "Envió su autoevaluación");
    await client.query("commit");
  } catch (err) {
    await client.query("rollback").catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

// ---------- the scheduler ----------

export interface TickResult {
  opened: number;
  reminders: number;
  closed: number;
  delivered: number;
  failed: number;
}

/** Runs everything that is due: scheduled sends, reminders, closings (and the monthly repeat), then delivery by Resend if configured. */
export async function tick(pool: Pool, baseUrl: string, now = new Date()): Promise<TickResult> {
  await ensureSchema(pool);
  const result: TickResult = { opened: 0, reminders: 0, closed: 0, delivered: 0, failed: 0 };

  const due = await pool.query<{ id: string }>("select id from self_eval_surveys where status = 'scheduled' and send_at <= $1", [now]);
  for (const { id } of due.rows) {
    const client = await pool.connect();
    try {
      await client.query("begin");
      await openSurvey(client, id, now, baseUrl);
      await client.query("commit");
      result.opened++;
    } catch {
      await client.query("rollback").catch(() => undefined);
    } finally {
      client.release();
    }
  }

  const open = await pool.query<{ id: string; title: string; closes_at: Date; reminder_hours: number[] }>("select id, title, closes_at, reminder_hours from self_eval_surveys where status = 'open'");
  for (const s of open.rows) {
    if (s.closes_at.getTime() <= now.getTime()) {
      const client = await pool.connect();
      try {
        await client.query("begin");
        await closeSurvey(client, s.id, "Cerró al terminar el plazo");
        await scheduleNextMonth(client, s.id);
        await client.query("commit");
        result.closed++;
      } catch {
        await client.query("rollback").catch(() => undefined);
      } finally {
        client.release();
      }
      continue;
    }
    const hoursLeft = (s.closes_at.getTime() - now.getTime()) / HOUR;
    const thresholds = [...s.reminder_hours].sort((a, b) => b - a);
    const dueCount = thresholds.filter((h) => hoursLeft <= h).length;
    if (dueCount === 0) continue;
    const pending = await pool.query<{ strategist_id: string; email: string; token: string; reminders_sent: number }>(
      "select strategist_id, email, token, reminders_sent from self_eval_invites where survey_id = $1 and status = 'sent' and reminders_sent < $2",
      [s.id, dueCount],
    );
    for (const p of pending.rows) {
      await enqueue(pool, reminderMail({ name: firstName(p.strategist_id), title: s.title, link: linkFor(baseUrl, p.token), closesAt: s.closes_at.toISOString(), hoursLeft }), "reminder", p.email, s.id, p.strategist_id);
      await pool.query("update self_eval_invites set reminders_sent = $3, last_reminder_at = $4 where survey_id = $1 and strategist_id = $2", [s.id, p.strategist_id, dueCount, now]);
      await logEvent(pool, s.id, p.strategist_id, "reminder", `Recordatorio ${dueCount} en cola (quedan ${Math.max(0, Math.round(hoursLeft))} h)`);
      result.reminders++;
    }
  }

  const delivery = await deliverWithResend(pool);
  result.delivered = delivery.sent;
  result.failed = delivery.failed;
  return result;
}

// ---------- delivery ----------

async function deliverWithResend(pool: Pool): Promise<{ sent: number; failed: number }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: 0, failed: 0 };
  const from = process.env.MAIL_FROM || "BluePixel Estrategas <onboarding@resend.dev>";
  const { rows } = await pool.query<{ id: string; to_email: string; subject: string; html: string; body: string }>(
    "select id, to_email, subject, html, body from email_outbox where status = 'queued' order by id limit 50",
  );
  let sent = 0;
  let failed = 0;
  for (const m of rows) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [m.to_email], subject: m.subject, html: m.html, text: m.body }),
      });
      if (!res.ok) throw new Error(`Resend respondió ${res.status}`);
      await pool.query("update email_outbox set status = 'sent', sent_at = now(), attempts = attempts + 1, error = null where id = $1", [m.id]);
      sent++;
    } catch (err) {
      await pool.query("update email_outbox set status = case when attempts + 1 >= 3 then 'failed' else 'queued' end, attempts = attempts + 1, error = $2 where id = $1", [m.id, err instanceof Error ? err.message : "Error de envío"]);
      failed++;
    }
  }
  return { sent, failed };
}

/** What the Apps Script worker should send now. */
export async function queuedMail(pool: Pool, limit = 25): Promise<{ id: string; to: string; subject: string; html: string; text: string }[]> {
  await ensureSchema(pool);
  const { rows } = await pool.query<{ id: string; to_email: string; subject: string; html: string; body: string }>(
    "select id, to_email, subject, html, body from email_outbox where status = 'queued' order by id limit $1",
    [limit],
  );
  return rows.map((r) => ({ id: String(r.id), to: r.to_email, subject: r.subject, html: r.html, text: r.body }));
}

export async function ackMail(pool: Pool, id: string, ok: boolean, error?: string): Promise<void> {
  await ensureSchema(pool);
  await pool.query(
    ok
      ? "update email_outbox set status = 'sent', sent_at = now(), attempts = attempts + 1, error = null where id = $1"
      : "update email_outbox set status = case when attempts + 1 >= 3 then 'failed' else 'queued' end, attempts = attempts + 1, error = $2 where id = $1",
    ok ? [id] : [id, (error ?? "Error de envío").slice(0, 300)],
  );
}

export { DEFAULT_REMINDER_HOURS, DEFAULT_WINDOW_HOURS };
