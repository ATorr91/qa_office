"use client";

import { useState } from "react";
import { PROJECT_CATALOG, projectIdOf } from "@/lib/projectCatalog";
import { todayInMexico } from "@/lib/projectHours";
import { useProjectProcess } from "@/lib/projectProcess";
import { DEFAULT_WEEKLY_CAPACITY, TOOLS } from "@/lib/projectProcessTypes";
import { EMPLOYMENT_LABELS, STRATEGISTS } from "@/lib/strategists";

const input = "w-full rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-2 py-1 text-[12px] text-[var(--bp-ink)] outline-none focus:border-[var(--bp-blue)]";
const btn = "bp-tap rounded-[var(--bp-radius-sm)] bg-[var(--bp-blue)] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[var(--bp-blue-600)] disabled:opacity-50";

function Panel({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
      <h3 className="text-[13px] font-bold text-[var(--bp-ink)]">{title}</h3>
      <p className="mt-0.5 text-[11px] text-[var(--bp-ink-soft)]">{hint}</p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function CapacityPanel() {
  const { settings, saveSettings } = useProjectProcess();
  const [draft, setDraft] = useState<Record<string, string>>(() => Object.fromEntries(STRATEGISTS.map((s) => [s.id, String(settings.weeklyHours[s.id] ?? "")])));
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    const weeklyHours: Record<string, number> = {};
    for (const [id, v] of Object.entries(draft)) {
      const n = Number(v);
      if (v.trim() !== "" && Number.isFinite(n) && n >= 1 && n <= 80) weeklyHours[id] = n;
    }
    const ok = await saveSettings({ ...settings, weeklyHours });
    setMsg(ok ? "✓ Guardado" : "No se pudo guardar.");
  }

  return (
    <Panel title="Capacidad semanal" hint={`Horas por semana que puede dar cada persona. Jira no guarda la capacidad, así que se fija aquí; si se deja vacío se usan ${DEFAULT_WEEKLY_CAPACITY} h.`}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STRATEGISTS.map((s) => (
          <label key={s.id} className="flex flex-col gap-1 text-[11px] text-[var(--bp-ink-soft)]">
            <span>
              <span className="font-semibold text-[var(--bp-ink)]">{s.name}</span> · {EMPLOYMENT_LABELS[s.employment]}
            </span>
            <input type="number" min={1} max={80} value={draft[s.id]} placeholder={String(DEFAULT_WEEKLY_CAPACITY)} onChange={(e) => { setDraft({ ...draft, [s.id]: e.target.value }); setMsg(null); }} className={input} />
          </label>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button type="button" onClick={save} className={btn}>
          Guardar capacidad
        </button>
        {msg && <span role="status" className="text-[11px] text-[var(--bp-ink-soft)]">{msg}</span>}
      </div>
    </Panel>
  );
}

function ToolUsagePanel() {
  const { addToolUsage } = useProjectProcess();
  const [day, setDay] = useState(todayInMexico());
  const [strategistId, setStrategistId] = useState(STRATEGISTS[0].id);
  const [tool, setTool] = useState<string>(TOOLS[0]);
  const [projectId, setProjectId] = useState("");
  const [units, setUnits] = useState("1");
  const [unit, setUnit] = useState("sesiones");
  const [msg, setMsg] = useState<string | null>(null);
  const valid = Number.isFinite(Number(units)) && Number(units) >= 0 && units.trim() !== "";

  async function add() {
    const ok = await addToolUsage([{ day, tool, strategistId, projectId, units: Number(units), unit: unit.trim() }]);
    setMsg(ok ? `✓ Guardado (${tool}, ${day})` : "No se pudo guardar.");
  }

  return (
    <Panel title="Registrar uso de una herramienta" hint="Un registro por día, persona, herramienta y proyecto: si repites la combinación, se reemplaza; con 0 unidades se borra. Para que llegue solo, una automatización puede mandarlo a /api/tool-usage.">
      <div className="grid gap-3 sm:grid-cols-6">
        <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
          Día
          <input type="date" value={day} onChange={(e) => setDay(e.target.value)} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-ink-soft)] sm:col-span-2">
          Persona
          <select value={strategistId} onChange={(e) => setStrategistId(e.target.value)} className={input}>
            {STRATEGISTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-ink-soft)] sm:col-span-2">
          Herramienta
          <select value={tool} onChange={(e) => setTool(e.target.value)} className={input}>
            {TOOLS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
          Unidades
          <input type="number" min={0} value={units} onChange={(e) => setUnits(e.target.value)} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-ink-soft)] sm:col-span-2">
          Qué cuentan las unidades
          <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="sesiones, versiones, horas…" className={input} />
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-ink-soft)] sm:col-span-3">
          Proyecto (opcional)
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={input}>
            <option value="">Sin proyecto</option>
            {PROJECT_CATALOG.filter((p) => p.status === "active").map((p) => (
              <option key={projectIdOf(p)} value={projectIdOf(p)}>
                {p.code} · {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button type="button" onClick={add} disabled={!valid} className={btn}>
          Guardar uso
        </button>
        {msg && <span role="status" className="text-[11px] text-[var(--bp-ink-soft)]">{msg}</span>}
      </div>
    </Panel>
  );
}

export function AdminCapacityTools() {
  const { hydrated } = useProjectProcess();
  if (!hydrated) return <p className="text-[12px] text-[var(--bp-ink-soft)]">Cargando…</p>;
  return (
    <div className="flex flex-col gap-4">
      <CapacityPanel />
      <ToolUsagePanel />
    </div>
  );
}

export default AdminCapacityTools;
