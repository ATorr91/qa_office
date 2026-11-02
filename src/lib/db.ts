// Server-only Postgres access for the Dashboard de Estrategas data entered in the Admin section.
// Never import this from a "use client" component — it reads DATABASE_URL from the environment.
// Works with any Postgres: Neon / Vercel Postgres in production, a local server in development.
import "server-only";

import { Pool } from "pg";

const globalForDb = globalThis as unknown as { __strategistPool?: Pool | null; __strategistSchema?: { sql: string; ready: Promise<void> } | null };

/** The shared pool, or null when DATABASE_URL isn't set (the app then falls back to per-browser storage). */
export function getPool(): Pool | null {
  if (globalForDb.__strategistPool !== undefined) return globalForDb.__strategistPool;
  // pg treats sslmode=require as verify-full today and will change that in v9; saying so explicitly keeps the
  // current (stricter) behavior and silences the deprecation warning.
  const url = process.env.DATABASE_URL?.replace(/sslmode=require\b/, "sslmode=verify-full");
  // Kept on globalThis so dev hot-reloads reuse one pool instead of opening a new one per edit.
  globalForDb.__strategistPool = url ? new Pool({ connectionString: url, max: 3, idleTimeoutMillis: 10_000 }) : null;
  return globalForDb.__strategistPool;
}

// One row per (strategist, month) so two admins editing different people never overwrite each other.
const SCHEMA = `
  create table if not exists strategist_month_records (
    strategist_id text not null,
    month text not null,
    data jsonb not null,
    updated_at timestamptz not null default now(),
    primary key (strategist_id, month)
  );
  create table if not exists strategist_projects (
    strategist_id text primary key,
    projects jsonb not null,
    updated_at timestamptz not null default now()
  );
  create table if not exists strategist_jira_boards (
    strategist_id text primary key,
    project_keys text not null,
    updated_at timestamptz not null default now()
  );
  create table if not exists strategist_sources (
    strategist_id text primary key,
    uses_jira boolean not null,
    uses_bitacoras boolean not null,
    updated_at timestamptz not null default now()
  );
  create table if not exists external_scores (
    source text not null,
    ref text not null,
    account text not null,
    period text not null,
    data jsonb not null,
    origin text not null default 'sync',
    updated_at timestamptz not null default now(),
    primary key (source, ref)
  );
  create table if not exists self_eval_surveys (
    id text primary key,
    title text not null,
    period text not null,
    questions jsonb not null,
    status text not null,
    send_at timestamptz,
    window_hours int not null,
    reminder_hours jsonb not null,
    repeat_monthly boolean not null default false,
    parent_id text,
    sent_at timestamptz,
    closes_at timestamptz,
    created_at timestamptz not null default now()
  );
  create table if not exists self_eval_invites (
    survey_id text not null,
    strategist_id text not null,
    email text not null,
    token text not null unique,
    status text not null,
    sent_at timestamptz,
    reminders_sent int not null default 0,
    last_reminder_at timestamptz,
    answered_at timestamptz,
    primary key (survey_id, strategist_id)
  );
  create table if not exists self_eval_responses (
    survey_id text not null,
    strategist_id text not null,
    answers jsonb not null,
    submitted_at timestamptz not null default now(),
    primary key (survey_id, strategist_id)
  );
  create table if not exists self_eval_events (
    id bigserial primary key,
    survey_id text not null,
    strategist_id text,
    type text not null,
    detail text not null default '',
    at timestamptz not null default now()
  );
  create table if not exists email_outbox (
    id bigserial primary key,
    kind text not null,
    to_email text not null,
    subject text not null,
    html text not null,
    body text not null,
    survey_id text,
    strategist_id text,
    status text not null default 'queued',
    attempts int not null default 0,
    error text,
    created_at timestamptz not null default now(),
    sent_at timestamptz
  );
`;

/** Creates the tables on first use (idempotent); retried on the next call if it fails or the schema text changed (dev reloads). */
export async function ensureSchema(pool: Pool): Promise<void> {
  const current = globalForDb.__strategistSchema;
  if (current && current.sql === SCHEMA) return current.ready;
  const ready = pool.query(SCHEMA).then(() => undefined);
  globalForDb.__strategistSchema = { sql: SCHEMA, ready };
  ready.catch(() => {
    if (globalForDb.__strategistSchema?.ready === ready) globalForDb.__strategistSchema = null;
  });
  return ready;
}
