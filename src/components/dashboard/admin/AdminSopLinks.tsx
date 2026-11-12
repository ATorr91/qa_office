"use client";

import { useState } from "react";
import { useProjectProcess } from "@/lib/projectProcess";
import { sopKey } from "@/lib/projectProcessTypes";
import { STAGES } from "@/lib/procesoStages";

const input = "w-full rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-2 py-1 text-[12px] text-[var(--bp-ink)] outline-none transition-colors focus:border-[var(--bp-blue)]";
const isLink = (v: string) => v.trim() === "" || /^https?:\/\//i.test(v.trim());

/** Admin: the team's own document for each SOP. It shows as "Abrir SOP" on the stage page, next to the public reference if there is one. */
export default function AdminSopLinks() {
  const { settings, saveSettings, hydrated } = useProjectProcess();
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const valueOf = (key: string) => edits[key] ?? settings.sopLinks[key] ?? "";
  const dirty = Object.keys(edits).length > 0;
  const invalid = Object.values(edits).some((v) => !isLink(v));

  async function save() {
    const sopLinks = { ...settings.sopLinks };
    for (const [key, v] of Object.entries(edits)) {
      if (v.trim() === "") delete sopLinks[key];
      else sopLinks[key] = v.trim();
    }
    const ok = await saveSettings({ ...settings, sopLinks });
    if (ok) setEdits({});
    setMsg(ok ? "✓ Guardado" : "No se pudo guardar.");
  }

  return (
    <section className="rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
      <h3 className="text-[13px] font-bold text-[var(--bp-ink)]">Enlaces de los SOPs</h3>
      <p className="mt-0.5 text-[11px] text-[var(--bp-ink-soft)]">Documento del equipo (Drive, Notion...) de cada SOP. Solo enlaces http o https.</p>
      <div className="mt-3 flex flex-col gap-5">
        {STAGES.map((stage) => (
          <div key={stage.id}>
            <h4 className="text-[12px] font-bold text-[var(--bp-ink)]">
              {stage.number}. {stage.name}
            </h4>
            <div className="mt-1.5 flex flex-col gap-2">
              {stage.sops.map((sop) => {
                const key = sopKey(stage.id, sop.title);
                const v = valueOf(key);
                return (
                  <label key={key} className="grid items-center gap-1 text-[12px] text-[var(--bp-ink)] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:gap-3">
                    <span>{sop.title}</span>
                    <input type="url" disabled={!hydrated} value={v} placeholder="https://" aria-invalid={!isLink(v)} onChange={(e) => { setEdits({ ...edits, [key]: e.target.value }); setMsg(null); }} className={`${input} ${isLink(v) ? "" : "border-[var(--bp-danger)]"}`} />
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={save} disabled={!dirty || invalid || !hydrated} className="bp-tap rounded-[var(--bp-radius-sm)] bg-[var(--bp-blue)] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[var(--bp-blue-600)] disabled:opacity-50">
          Guardar enlaces
        </button>
        {invalid && <span className="text-[11px] text-[var(--bp-danger)]">Hay un enlace que no empieza con http(s)://</span>}
        {msg && (
          <span role="status" className="text-[11px] text-[var(--bp-ink-soft)]">
            {msg}
          </span>
        )}
      </div>
    </section>
  );
}
