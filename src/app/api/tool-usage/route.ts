import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { ensureSchema, getPool } from "@/lib/db";
import { hasAutomationSecret } from "@/lib/externalScoresStore";
import { PROJECT_CATALOG, projectIdOf } from "@/lib/projectCatalog";
import { TOOLS, type ToolUsageRow } from "@/lib/projectProcessTypes";
import { STRATEGISTS } from "@/lib/strategists";

const NO_STORE = { "Cache-Control": "no-store" };
const KNOWN_STRATEGISTS: ReadonlySet<string> = new Set(STRATEGISTS.map((s) => s.id));
const KNOWN_PROJECTS: ReadonlySet<string> = new Set(PROJECT_CATALOG.map(projectIdOf));
const MAX_ROWS = 500;
const DEFAULT_DAYS = 60;

/** Usage rows of the last `?days=` days (default 60). */
export async function GET(request: NextRequest) {
  const pool = getPool();
  if (!pool) return NextResponse.json({ configured: false, rows: [] }, { headers: NO_STORE });
  const days = Math.min(400, Math.max(1, Number(request.nextUrl.searchParams.get("days")) || DEFAULT_DAYS));
  try {
    await ensureSchema(pool);
    const res = await pool.query<{ day: string; tool: string; strategist_id: string; project_id: string; units: string; unit: string; origin: string }>(
      `select to_char(day, 'YYYY-MM-DD') as day, tool, strategist_id, project_id, units, unit, origin
         from tool_usage where day >= current_date - $1::int order by day desc`,
      [days],
    );
    const rows: ToolUsageRow[] = res.rows
      .filter((r) => KNOWN_STRATEGISTS.has(r.strategist_id))
      .map((r) => ({ day: r.day, tool: r.tool, strategistId: r.strategist_id, projectId: r.project_id, units: Number(r.units), unit: r.unit, origin: r.origin }));
    return NextResponse.json({ configured: true, rows }, { headers: NO_STORE });
  } catch (err) {
    return NextResponse.json({ configured: true, rows: [], error: err instanceof Error ? err.message : "Error desconocido al leer el uso de herramientas." }, { status: 500, headers: NO_STORE });
  }
}

interface IncomingRow {
  day: string;
  tool: string;
  strategistId: string;
  projectId: string;
  units: number;
  unit: string;
}

function parseRows(body: unknown): IncomingRow[] {
  const rows = (body as { rows?: unknown } | null)?.rows;
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > MAX_ROWS) throw new Error(`Manda entre 1 y ${MAX_ROWS} filas en «rows».`);
  return rows.map((raw, i) => {
    const r = raw as Record<string, unknown>;
    const where = `Fila ${i + 1}:`;
    if (typeof r.day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(r.day) || Number.isNaN(Date.parse(r.day))) throw new Error(`${where} «day» debe ser YYYY-MM-DD.`);
    if (typeof r.tool !== "string" || !(TOOLS as readonly string[]).includes(r.tool)) throw new Error(`${where} «tool» debe ser una de: ${TOOLS.join(", ")}.`);
    if (typeof r.strategistId !== "string" || !KNOWN_STRATEGISTS.has(r.strategistId)) throw new Error(`${where} «strategistId» desconocido.`);
    const projectId = typeof r.projectId === "string" ? r.projectId : "";
    if (projectId !== "" && !KNOWN_PROJECTS.has(projectId)) throw new Error(`${where} «projectId» desconocido.`);
    if (typeof r.units !== "number" || !Number.isFinite(r.units) || r.units < 0 || r.units > 1e6) throw new Error(`${where} «units» debe ser un número entre 0 y 1,000,000.`);
    const unit = typeof r.unit === "string" ? r.unit.slice(0, 30).trim() : "";
    return { day: r.day, tool: r.tool, strategistId: r.strategistId, projectId, units: r.units, unit };
  });
}

/**
 * Saves daily usage per tool, person and (optionally) project. Allowed for an admin session (manual entry) or an automation with
 * `Authorization: Bearer <INGEST_SECRET>`. Sending the same day again replaces it; `units: 0` removes it.
 */
export async function POST(request: NextRequest) {
  const automation = hasAutomationSecret(request);
  if (!automation && !isAdminRequest(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: NO_STORE });
  const pool = getPool();
  if (!pool) return NextResponse.json({ error: "DATABASE_URL no está configurada en el servidor." }, { status: 503, headers: NO_STORE });

  let rows: IncomingRow[];
  try {
    rows = parseRows(await request.json().catch(() => null));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Solicitud no válida." }, { status: 400, headers: NO_STORE });
  }

  const client = await pool.connect().catch(() => null);
  if (!client) return NextResponse.json({ error: "No se pudo conectar con la base de datos." }, { status: 502, headers: NO_STORE });
  try {
    await ensureSchema(pool);
    await client.query("begin");
    for (const r of rows) {
      if (r.units === 0) {
        await client.query("delete from tool_usage where day = $1 and tool = $2 and strategist_id = $3 and project_id = $4", [r.day, r.tool, r.strategistId, r.projectId]);
      } else {
        await client.query(
          `insert into tool_usage (day, tool, strategist_id, project_id, units, unit, origin) values ($1, $2, $3, $4, $5, $6, $7)
           on conflict (day, tool, strategist_id, project_id) do update set units = excluded.units, unit = excluded.unit, origin = excluded.origin, updated_at = now()`,
          [r.day, r.tool, r.strategistId, r.projectId, r.units, r.unit, automation ? "sync" : "manual"],
        );
      }
    }
    await client.query("commit");
    return NextResponse.json({ ok: true, saved: rows.length }, { headers: NO_STORE });
  } catch (err) {
    await client.query("rollback").catch(() => undefined);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error desconocido al guardar." }, { status: 500, headers: NO_STORE });
  } finally {
    client.release();
  }
}
