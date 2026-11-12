"use client";

import { useState } from "react";
import StrategistAvatar from "@/components/dashboard/StrategistAvatar";
import { useProjectProcess } from "@/lib/projectProcess";
import { EMPTY_PROFILE_NOTES, MAX_PROFILE_ITEM_LENGTH, MAX_PROFILE_ITEMS } from "@/lib/projectProcessTypes";
import { deriveInsights } from "@/lib/strategistInsights";
import { useEffectiveRecordFor } from "@/lib/strategistRecords";
import { EMPLOYMENT_LABELS, getPeriodLabel, STRATEGISTS } from "@/lib/strategists";
import { useDashboardFilters } from "@/lib/dashboardFilters";

const area = "w-full rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-2.5 py-2 text-[12px] leading-relaxed text-[var(--bp-ink)] outline-none transition-colors focus:border-[var(--bp-blue)]";
const btn = "bp-tap rounded-[var(--bp-radius-sm)] bg-[var(--bp-blue)] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[var(--bp-blue-600)] disabled:opacity-50";

type Draft = { strengths: string; weaknesses: string };
const toLines = (items: string[]) => items.join("\n");
const fromLines = (text: string) => text.split("\n").map((l) => l.trim().slice(0, MAX_PROFILE_ITEM_LENGTH)).filter(Boolean).slice(0, MAX_PROFILE_ITEMS);

/** Admin editor for each person's strengths and weaknesses, one sentence per line, with the data's own suggestions one click away. */
export default function AdminProfiles() {
  const { settings, saveSettings, hydrated } = useProjectProcess();
  const { period } = useDashboardFilters();
  const [selected, setSelected] = useState(STRATEGISTS[0].id);
  const [edits, setEdits] = useState<Record<string, Draft>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const found = useEffectiveRecordFor(selected);

  const saved = settings.profiles[selected] ?? EMPTY_PROFILE_NOTES;
  const draft: Draft = edits[selected] ?? { strengths: toLines(saved.strengths), weaknesses: toLines(saved.weaknesses) };
  const dirty = edits[selected] !== undefined;
  const suggestions = found ? deriveInsights(found.r) : { strengths: [], weaknesses: [] };
  const person = STRATEGISTS.find((s) => s.id === selected)!;

  function set(next: Draft) {
    setEdits((prev) => ({ ...prev, [selected]: next }));
    setMsg(null);
  }

  function add(side: keyof Draft, text: string) {
    const lines = fromLines(draft[side]);
    if (lines.includes(text) || lines.length >= MAX_PROFILE_ITEMS) return;
    set({ ...draft, [side]: toLines([...lines, text]) });
  }

  async function save() {
    const profiles = { ...settings.profiles };
    const notes = { strengths: fromLines(draft.strengths), weaknesses: fromLines(draft.weaknesses) };
    if (notes.strengths.length === 0 && notes.weaknesses.length === 0) delete profiles[selected];
    else profiles[selected] = notes;
    const ok = await saveSettings({ ...settings, profiles });
    if (ok) {
      setEdits((prev) => {
        const rest = { ...prev };
        delete rest[selected];
        return rest;
      });
    }
    setMsg(ok ? "✓ Guardado" : "No se pudo guardar.");
  }

  return (
    <section className="rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
      <h3 className="text-[13px] font-bold text-[var(--bp-ink)]">Fortalezas y debilidades por persona</h3>
      <p className="mt-0.5 max-w-[70ch] text-[11px] text-[var(--bp-ink-soft)]">
        Una idea por línea, máximo {MAX_PROFILE_ITEMS} por lista. Se muestran en el perfil de cada persona junto con lo que dicen los datos. Escribe hechos observables (qué hizo y en qué proyecto) y no rasgos de personalidad.
      </p>

      <div role="tablist" aria-label="Persona" className="mt-3 flex flex-wrap gap-1.5">
        {STRATEGISTS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={selected === s.id}
            onClick={() => {
              setSelected(s.id);
              setMsg(null);
            }}
            className={`bp-tap rounded-[var(--bp-radius-pill)] border px-3 py-1.5 text-[12px] font-semibold transition-all duration-[var(--bp-dur-fast)] hover:-translate-y-px ${selected === s.id ? "border-[var(--bp-blue)] bg-[var(--bp-blue)]/10 text-[var(--bp-blue-600)]" : "border-[var(--bp-border)] text-[var(--bp-ink-soft)] hover:border-[var(--bp-blue)]"}`}
          >
            {s.name.split(" ")[0]}
            {settings.profiles[s.id] && <span aria-label="con notas" className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[var(--bp-green)]" />}
          </button>
        ))}
      </div>

      <div key={selected} className="bp-row-in mt-4">
        <div className="flex flex-wrap items-center gap-3">
          <StrategistAvatar strategist={person} size={36} />
          <span className="text-[11px] text-[var(--bp-ink-soft)]">{EMPLOYMENT_LABELS[person.employment]}</span>
        </div>

        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          {(["strengths", "weaknesses"] as const).map((side) => (
            <div key={side} className="flex flex-col gap-2">
              <label htmlFor={`profile-${side}`} className="text-[12px] font-bold text-[var(--bp-ink)]">
                {side === "strengths" ? "Fortalezas" : "Debilidades"} <span className="font-normal text-[var(--bp-ink-soft)]">({fromLines(draft[side]).length}/{MAX_PROFILE_ITEMS})</span>
              </label>
              <textarea id={`profile-${side}`} rows={6} disabled={!hydrated} value={draft[side]} onChange={(e) => set({ ...draft, [side]: e.target.value })} placeholder={side === "strengths" ? "Ej.: Entrega los reportes de etapa a tiempo y con evidencia" : "Ej.: Los cambios de alcance se documentan tarde"} className={area} />
              {suggestions[side].length > 0 && (
                <div>
                  <div className="text-[10.5px] font-semibold text-[var(--bp-ink-soft)]">Lo que dicen los datos ({getPeriodLabel(period)})</div>
                  <ul className="mt-1 flex flex-col gap-1">
                    {suggestions[side].map((d) => (
                      <li key={d.text}>
                        <button
                          type="button"
                          onClick={() => add(side, d.text)}
                          data-tip={`Agregar a ${side === "strengths" ? "fortalezas" : "debilidades"}`}
                          className="bp-tap group/s flex w-full items-start gap-2 rounded-[var(--bp-radius-sm)] px-2 py-1 text-left text-[12px] leading-snug text-[var(--bp-ink)] transition-colors duration-[var(--bp-dur-fast)] hover:bg-[var(--bp-surface-alt)]"
                        >
                          <span aria-hidden className="mt-px inline-block text-[var(--bp-blue-600)] transition-transform duration-[var(--bp-dur-fast)] group-hover/s:rotate-90">
                            +
                          </span>
                          <span>
                            {d.text} <span className="text-[10.5px] text-[var(--bp-ink-soft)]">{d.source}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button type="button" onClick={save} disabled={!dirty || !hydrated} className={btn}>
            Guardar notas de {person.name.split(" ")[0]}
          </button>
          {dirty && <span className="text-[11px] text-[var(--bp-ink-soft)]">Cambios sin guardar</span>}
          {msg && (
            <span role="status" className="text-[11px] text-[var(--bp-ink-soft)]">
              {msg}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
