import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { parseWrite, ValidationError } from "@/lib/dashboardDataValidation";
import { ensureSchema, getPool } from "@/lib/db";
import { STRATEGISTS } from "@/lib/strategists";

const NO_STORE = { "Cache-Control": "no-store" };
const KNOWN_IDS: ReadonlySet<string> = new Set(STRATEGISTS.map((s) => s.id));
const MAX_WRITES_PER_REQUEST = 200;

/** Everything the admin has entered. `configured: false` means no DATABASE_URL, so the client keeps using its own browser storage. */
export async function GET() {
  const pool = getPool();
  if (!pool) return NextResponse.json({ configured: false }, { headers: NO_STORE });

  try {
    await ensureSchema(pool);
    const [monthRows, projectRows, boardRows, sourceRows] = await Promise.all([
      pool.query<{ strategist_id: string; month: string; data: unknown }>("select strategist_id, month, data from strategist_month_records"),
      pool.query<{ strategist_id: string; projects: unknown }>("select strategist_id, projects from strategist_projects"),
      pool.query<{ strategist_id: string; project_keys: string }>("select strategist_id, project_keys from strategist_jira_boards"),
      pool.query<{ strategist_id: string; uses_jira: boolean; uses_bitacoras: boolean }>(
        "select strategist_id, uses_jira, uses_bitacoras from strategist_sources",
      ),
    ]);

    const records: Record<string, Record<string, unknown>> = {};
    for (const r of monthRows.rows) (records[r.strategist_id] ??= {})[r.month] = r.data;
    const projects = Object.fromEntries(projectRows.rows.map((r) => [r.strategist_id, r.projects]));
    const jiraBoards = Object.fromEntries(boardRows.rows.map((r) => [r.strategist_id, r.project_keys]));

    const sources = Object.fromEntries(sourceRows.rows.map((r) => [r.strategist_id, { jira: r.uses_jira, bitacoras: r.uses_bitacoras }]));

    return NextResponse.json({ configured: true, records, projects, jiraBoards, sources }, { headers: NO_STORE });
  } catch (err) {
    return NextResponse.json(
      { configured: true, error: err instanceof Error ? err.message : "Error desconocido al leer la base de datos." },
      { status: 500, headers: NO_STORE },
    );
  }
}

/** Saves one or more entries atomically. Admin only. Body: `{ writes: DashboardWrite[] }`. */
export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Sesión de admin no válida o vencida." }, { status: 401, headers: NO_STORE });
  }
  const pool = getPool();
  if (!pool) return NextResponse.json({ error: "DATABASE_URL no está configurada en el servidor." }, { status: 503, headers: NO_STORE });

  const body = (await request.json().catch(() => null)) as { writes?: unknown } | null;
  if (!body || !Array.isArray(body.writes) || body.writes.length === 0 || body.writes.length > MAX_WRITES_PER_REQUEST) {
    return NextResponse.json({ error: "Solicitud no válida." }, { status: 400, headers: NO_STORE });
  }

  let writes;
  try {
    writes = body.writes.map((w) => parseWrite(w, KNOWN_IDS));
  } catch (err) {
    if (err instanceof ValidationError) return NextResponse.json({ error: err.message }, { status: 400, headers: NO_STORE });
    throw err;
  }

  const client = await pool.connect().catch(() => null);
  if (!client) return NextResponse.json({ error: "No se pudo conectar con la base de datos." }, { status: 502, headers: NO_STORE });
  try {
    await ensureSchema(pool);
    await client.query("begin");
    for (const w of writes) {
      if (w.kind === "month") {
        await client.query(
          `insert into strategist_month_records (strategist_id, month, data) values ($1, $2, $3)
           on conflict (strategist_id, month) do update set data = excluded.data, updated_at = now()`,
          [w.strategistId, w.month, JSON.stringify(w.data)],
        );
      } else if (w.kind === "projects") {
        await client.query(
          `insert into strategist_projects (strategist_id, projects) values ($1, $2)
           on conflict (strategist_id) do update set projects = excluded.projects, updated_at = now()`,
          [w.strategistId, JSON.stringify(w.projects)],
        );
      } else if (w.kind === "sources") {
        await client.query(
          `insert into strategist_sources (strategist_id, uses_jira, uses_bitacoras) values ($1, $2, $3)
           on conflict (strategist_id) do update set uses_jira = excluded.uses_jira, uses_bitacoras = excluded.uses_bitacoras, updated_at = now()`,
          [w.strategistId, w.jira, w.bitacoras],
        );
      } else {
        await client.query(
          `insert into strategist_jira_boards (strategist_id, project_keys) values ($1, $2)
           on conflict (strategist_id) do update set project_keys = excluded.project_keys, updated_at = now()`,
          [w.strategistId, w.projectKeys],
        );
      }
    }
    await client.query("commit");
    return NextResponse.json({ ok: true, saved: writes.length }, { headers: NO_STORE });
  } catch (err) {
    await client.query("rollback").catch(() => undefined);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido al guardar en la base de datos." },
      { status: 500, headers: NO_STORE },
    );
  } finally {
    client.release();
  }
}
