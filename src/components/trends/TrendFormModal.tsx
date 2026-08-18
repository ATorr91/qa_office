"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import {
  CATEGORY_OPTIONS,
  PESTLE_OPTIONS,
  RING_LABELS,
  RING_OPTIONS,
  type PestleCategory,
  type RealExample,
  type Trend,
} from "@/lib/trends";

type Draft = Omit<Trend, "id">;

function examplesToText(examples: RealExample[]): string {
  return examples.map((ex) => `${ex.org} — ${ex.detail}`).join("\n");
}

function textToExamples(text: string): RealExample[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [org, ...rest] = line.split("—");
      return rest.length > 0
        ? { org: org.trim(), detail: rest.join("—").trim() }
        : { org: line.trim(), detail: "" };
    });
}

function inputClass() {
  return "w-full rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-3 py-1.5 text-[13px] text-[var(--bp-ink)] outline-none focus:border-[var(--bp-blue)]";
}

function labelClass() {
  return "mb-1 block text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]";
}

function emptyDraft(): Draft {
  return {
    title: "",
    category: "Diseño UX/UI",
    ring: "emergente",
    summary: "",
    source: "",
    sourceUrl: "",
    spottedAt: new Date().toISOString().slice(0, 10),
    soWhat: { porque: "", impacto: "", accion: "" },
    relevance: 50,
    trending: 50,
    opportunity: 50,
    pinned: false,
    pestle: [],
    realExamples: [],
    adopters: [],
    impactPotential: "",
  };
}

export function TrendFormModal({
  mode,
  initial,
  title,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  initial?: Draft;
  title?: string;
  onClose: () => void;
  onSubmit: (draft: Draft) => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => initial ?? emptyDraft());
  const [examplesText, setExamplesText] = useState(() => examplesToText((initial ?? emptyDraft()).realExamples));

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function updateSoWhat<K extends keyof Draft["soWhat"]>(key: K, value: string) {
    setDraft((d) => ({ ...d, soWhat: { ...d.soWhat, [key]: value } }));
  }

  function togglePestle(p: PestleCategory) {
    setDraft((d) => ({
      ...d,
      pestle: d.pestle.includes(p) ? d.pestle.filter((x) => x !== p) : [...d.pestle, p],
    }));
  }

  const canSubmit = draft.title.trim() !== "" && draft.summary.trim() !== "" && draft.source.trim() !== "";

  return (
    <div
      className="bp-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bp-modal-panel flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] shadow-[var(--bp-shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--bp-border)] px-5 py-4">
          <h2 className="text-base font-semibold text-[var(--bp-ink)]">
            {title ?? (mode === "create" ? "Nueva tendencia" : "Editar tendencia")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-[var(--bp-radius-sm)] p-1.5 text-[var(--bp-ink-soft)] hover:bg-[var(--bp-surface-alt)]"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-3">
            <div>
              <label className={labelClass()}>Título</label>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => update("title", e.target.value)}
                className={inputClass()}
                placeholder="Nombre de la tendencia"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass()}>Categoría</label>
                <select
                  value={draft.category}
                  onChange={(e) => update("category", e.target.value as Trend["category"])}
                  className={inputClass()}
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass()}>Anillo</label>
                <select
                  value={draft.ring}
                  onChange={(e) => update("ring", e.target.value as Trend["ring"])}
                  className={inputClass()}
                >
                  {RING_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {RING_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass()}>Resumen</label>
              <textarea
                value={draft.summary}
                onChange={(e) => update("summary", e.target.value)}
                rows={3}
                className={inputClass()}
                placeholder="¿En qué consiste esta tendencia?"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass()}>Fuente</label>
                <input
                  type="text"
                  value={draft.source}
                  onChange={(e) => update("source", e.target.value)}
                  className={inputClass()}
                  placeholder="p. ej. WGSN"
                />
              </div>
              <div>
                <label className={labelClass()}>URL de la fuente (opcional)</label>
                <input
                  type="text"
                  value={draft.sourceUrl ?? ""}
                  onChange={(e) => update("sourceUrl", e.target.value)}
                  className={inputClass()}
                  placeholder="https://…"
                />
              </div>
            </div>

            <div>
              <label className={labelClass()}>Detectada el</label>
              <input
                type="date"
                value={draft.spottedAt}
                onChange={(e) => update("spottedAt", e.target.value)}
                className={inputClass()}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <ScoreField label="Relevancia" value={draft.relevance} onChange={(v) => update("relevance", v)} />
              <ScoreField label="En tendencia" value={draft.trending} onChange={(v) => update("trending", v)} />
              <ScoreField label="Oportunidad" value={draft.opportunity} onChange={(v) => update("opportunity", v)} />
            </div>

            <div>
              <label className={labelClass()}>Marco PESTLE</label>
              <div className="flex flex-wrap gap-1.5">
                {PESTLE_OPTIONS.map((p) => {
                  const active = draft.pestle.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePestle(p)}
                      className={`rounded-[var(--bp-radius-pill)] border px-2.5 py-1 text-[11px] font-medium transition-colors duration-[var(--bp-dur)] ${
                        active
                          ? "border-[var(--bp-blue)] bg-[var(--bp-blue)]/10 text-[var(--bp-blue-600)]"
                          : "border-[var(--bp-border)] text-[var(--bp-ink-soft)] hover:border-[var(--bp-blue)]"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className={labelClass()}>Quién ya lo está usando (separado por comas)</label>
              <input
                type="text"
                value={draft.adopters.join(", ")}
                onChange={(e) =>
                  update(
                    "adopters",
                    e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  )
                }
                className={inputClass()}
                placeholder="p. ej. Notion, Linear, Stripe"
              />
            </div>

            <div>
              <label className={labelClass()}>Ejemplos reales (uno por línea: Organización — descripción)</label>
              <textarea
                value={examplesText}
                onChange={(e) => setExamplesText(e.target.value)}
                rows={3}
                className={inputClass()}
                placeholder={"Notion — usa IA para generar layouts de página bajo demanda"}
              />
            </div>

            <div>
              <label className={labelClass()}>Impacto potencial</label>
              <textarea
                value={draft.impactPotential}
                onChange={(e) => update("impactPotential", e.target.value)}
                rows={2}
                className={inputClass()}
                placeholder="¿Qué podría cambiar si esta tendencia se consolida?"
              />
            </div>

            <div className="mt-1 flex flex-col gap-2 rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] p-3">
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-ink)]">
                El filtro &quot;So What?&quot;
              </h3>
              <div>
                <label className={labelClass()}>¿Por qué nos importa esto?</label>
                <textarea
                  value={draft.soWhat.porque}
                  onChange={(e) => updateSoWhat("porque", e.target.value)}
                  rows={2}
                  className={inputClass()}
                />
              </div>
              <div>
                <label className={labelClass()}>¿Cómo impacta a nuestros clientes?</label>
                <textarea
                  value={draft.soWhat.impacto}
                  onChange={(e) => updateSoWhat("impacto", e.target.value)}
                  rows={2}
                  className={inputClass()}
                />
              </div>
              <div>
                <label className={labelClass()}>¿Qué acción concreta podemos hacer esta semana?</label>
                <textarea
                  value={draft.soWhat.accion}
                  onChange={(e) => updateSoWhat("accion", e.target.value)}
                  rows={2}
                  className={inputClass()}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--bp-border)] px-5 py-3.5">
          <Button kind="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            disabled={!canSubmit}
            onClick={() => onSubmit({ ...draft, realExamples: textToExamples(examplesText) })}
          >
            {mode === "create" ? "Añadir al radar" : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ScoreField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className={labelClass()}>
        {label} <span className="font-mono text-[var(--bp-ink)]">{value}</span>
      </label>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--bp-blue)]"
      />
    </div>
  );
}

export default TrendFormModal;
