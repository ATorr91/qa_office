import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { ensureSchema, getPool } from "@/lib/db";
import { PROJECT_CATALOG, projectIdOf } from "@/lib/projectCatalog";
import { sanitizeProjectProcess, sanitizeSettings, ValidationError } from "@/lib/projectProcessValidation";
import { STRATEGISTS } from "@/lib/strategists";

const NO_STORE = { "Cache-Control": "no-store" };
const KNOWN_STRATEGISTS: ReadonlySet<string> = new Set(STRATEGISTS.map((s) => s.id));
const KNOWN_PROJECTS: ReadonlySet<string> = new Set(PROJECT_CATALOG.map(projectIdOf));
const SETTINGS_KEY = "settings";

/** Every project's process data and the dashboard settings. `configured: false` means no DATABASE_URL, so the client keeps them in its own browser storage. */
export async function GET() {
  const pool = getPool();
  if (!pool) return NextResponse.json({ configured: false }, { headers: NO_STORE });
  try {
    await ensureSchema(pool);
    const [projects, settings] = await Promise.all([
      pool.query<{ project_id: string; data: unknown }>("select project_id, data from project_process"),
      pool.query<{ data: unknown }>("select data from dashboard_settings where key = $1", [SETTINGS_KEY]),
    ]);
    const byProject: Record<string, unknown> = {};
    for (const r of projects.rows) if (KNOWN_PROJECTS.has(r.project_id)) byProject[r.project_id] = r.data;
    return NextResponse.json({ configured: true, projects: byProject, settings: settings.rows[0]?.data ?? { weeklyHours: {}, profiles: {}, sopLinks: {} } }, { headers: NO_STORE });
  } catch (err) {
    return NextResponse.json({ configured: true, error: err instanceof Error ? err.message : "Error desconocido al leer la base de datos." }, { status: 500, headers: NO_STORE });
  }
}

/** Saves one project's process data (`{ projectId, data }`) or the settings (`{ settings }`). Admin only. */
export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Sesión de admin no válida o vencida." }, { status: 401, headers: NO_STORE });
  const pool = getPool();
  if (!pool) return NextResponse.json({ error: "DATABASE_URL no está configurada en el servidor." }, { status: 503, headers: NO_STORE });

  const body = (await request.json().catch(() => null)) as { projectId?: unknown; data?: unknown; settings?: unknown } | null;
  if (!body) return NextResponse.json({ error: "Solicitud no válida." }, { status: 400, headers: NO_STORE });

  try {
    await ensureSchema(pool);
    if (body.settings !== undefined) {
      const settings = sanitizeSettings(body.settings, KNOWN_STRATEGISTS);
      await pool.query(
        `insert into dashboard_settings (key, data) values ($1, $2)
         on conflict (key) do update set data = excluded.data, updated_at = now()`,
        [SETTINGS_KEY, JSON.stringify(settings)],
      );
      return NextResponse.json({ ok: true }, { headers: NO_STORE });
    }
    if (typeof body.projectId !== "string" || !KNOWN_PROJECTS.has(body.projectId)) {
      return NextResponse.json({ error: "Proyecto desconocido." }, { status: 400, headers: NO_STORE });
    }
    const data = sanitizeProjectProcess(body.data, KNOWN_STRATEGISTS);
    await pool.query(
      `insert into project_process (project_id, data) values ($1, $2)
       on conflict (project_id) do update set data = excluded.data, updated_at = now()`,
      [body.projectId, JSON.stringify(data)],
    );
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (err) {
    if (err instanceof ValidationError) return NextResponse.json({ error: err.message }, { status: 400, headers: NO_STORE });
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error desconocido al guardar." }, { status: 500, headers: NO_STORE });
  }
}
