"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import {
  buildTrendFromMetrics,
  createEmptyDraft,
  CATEGORY_OPTIONS,
  STATUS_OPTIONS,
  type Actionable,
  type Priority,
  type Project,
  type Release,
  type TeamMember,
} from "@/lib/projects";

const STEPS = [
  "General",
  "Fechas",
  "Equipo",
  "Métricas QA",
  "Descripción",
  "Releases",
  "Accionables",
  "Revisión",
];

const PRIORITY_OPTIONS: Priority[] = ["Alta", "Media", "Baja"];

type Draft = Omit<Project, "id">;

function inputClass() {
  return "w-full rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-3 py-1.5 text-[13px] text-[var(--bp-ink)] outline-none focus:border-[var(--bp-blue)]";
}

function labelClass() {
  return "mb-1 block text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]";
}

export function ProjectWizard({
  mode,
  initial,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  initial?: Project;
  onClose: () => void;
  onSubmit: (draft: Draft) => void;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(() => {
    if (initial) {
      const { id: _id, ...rest } = initial;
      return rest;
    }
    return createEmptyDraft();
  });

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  const canProceed =
    step === 0
      ? draft.name.trim() !== "" && draft.client.trim() !== ""
      : step === 1
        ? draft.startDate !== "" && draft.endDate !== "" && draft.endDate >= draft.startDate
        : true;

  function handleSubmit() {
    const severity = draft.bugsBySeverity;
    const bugsOpen = severity.critical + severity.high + severity.medium + severity.low;
    const final: Draft = {
      ...draft,
      bugsOpen,
      bugsCritical: severity.critical,
      trend: mode === "create" ? buildTrendFromMetrics(draft.passRate, draft.testsExecuted) : draft.trend,
    };
    onSubmit(final);
  }

  return (
    <div
      className="bp-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bp-modal-panel flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] shadow-[var(--bp-shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--bp-border)] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--bp-ink)]">
              {mode === "create" ? "Nuevo proyecto" : `Editar: ${initial?.name}`}
            </h2>
            <p className="mt-0.5 text-[12px] text-[var(--bp-ink-soft)]">
              Paso {step + 1} de {STEPS.length} · {STEPS[step]}
            </p>
          </div>
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

        <div className="flex gap-1 px-5 pt-3">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={`h-1 flex-1 rounded-full ${i <= step ? "bg-[var(--bp-blue)]" : "bg-[var(--bp-border)]"}`}
            />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {step === 0 && (
            <div className="flex flex-col gap-3">
              <div>
                <label className={labelClass()}>Nombre del proyecto *</label>
                <input
                  className={inputClass()}
                  value={draft.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Ej. App Móvil Pagos"
                />
              </div>
              <div>
                <label className={labelClass()}>Cliente *</label>
                <input
                  className={inputClass()}
                  value={draft.client}
                  onChange={(e) => update("client", e.target.value)}
                  placeholder="Ej. Bimbo"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass()}>Categoría</label>
                  <select
                    className={inputClass()}
                    value={draft.category}
                    onChange={(e) => update("category", e.target.value as Draft["category"])}
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass()}>Prioridad</label>
                  <select
                    className={inputClass()}
                    value={draft.priority}
                    onChange={(e) => update("priority", e.target.value as Priority)}
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass()}>Estado</label>
                <select
                  className={inputClass()}
                  value={draft.status}
                  onChange={(e) => update("status", e.target.value as Draft["status"])}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass()}>Fecha de inicio *</label>
                  <input
                    type="date"
                    className={inputClass()}
                    value={draft.startDate}
                    onChange={(e) => update("startDate", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass()}>Fecha de fin *</label>
                  <input
                    type="date"
                    className={inputClass()}
                    value={draft.endDate}
                    onChange={(e) => update("endDate", e.target.value)}
                  />
                </div>
              </div>
              {draft.endDate < draft.startDate && (
                <p className="text-[12px] text-[var(--bp-danger)]">
                  La fecha de fin no puede ser anterior a la fecha de inicio.
                </p>
              )}
              <div>
                <label className={labelClass()}>Último reporte</label>
                <input
                  className={inputClass()}
                  value={draft.lastReportDate}
                  onChange={(e) => update("lastReportDate", e.target.value)}
                  placeholder="—"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <TeamStep
              team={draft.team}
              qaLead={draft.qaLead}
              onChangeTeam={(team) => update("team", team)}
              onChangeQaLead={(qaLead) => update("qaLead", qaLead)}
            />
          )}

          {step === 3 && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass()}>Aprobación (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className={inputClass()}
                    value={draft.passRate}
                    onChange={(e) => update("passRate", Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className={labelClass()}>Cobertura (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className={inputClass()}
                    value={draft.coverage}
                    onChange={(e) => update("coverage", Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className={labelClass()}>Pruebas ejecutadas</label>
                  <input
                    type="number"
                    min={0}
                    className={inputClass()}
                    value={draft.testsExecuted}
                    onChange={(e) => update("testsExecuted", Number(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass()}>Bugs abiertos por severidad</label>
                <div className="grid grid-cols-4 gap-3">
                  {(["critical", "high", "medium", "low"] as const).map((key) => (
                    <div key={key}>
                      <label className="mb-1 block text-[10px] capitalize text-[var(--bp-ink-soft)]">
                        {{ critical: "Crítico", high: "Alto", medium: "Medio", low: "Bajo" }[key]}
                      </label>
                      <input
                        type="number"
                        min={0}
                        className={inputClass()}
                        value={draft.bugsBySeverity[key]}
                        onChange={(e) =>
                          update("bugsBySeverity", {
                            ...draft.bugsBySeverity,
                            [key]: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-3">
              <div>
                <label className={labelClass()}>Descripción corta</label>
                <input
                  className={inputClass()}
                  value={draft.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Una línea sobre el proyecto"
                />
              </div>
              <div>
                <label className={labelClass()}>Resumen del estado actual</label>
                <textarea
                  rows={5}
                  className={`${inputClass()} resize-none`}
                  value={draft.summary}
                  onChange={(e) => update("summary", e.target.value)}
                  placeholder="Narrativa del avance, riesgos y siguientes pasos"
                />
              </div>
            </div>
          )}

          {step === 5 && (
            <ReleasesStep releases={draft.releases} onChange={(releases) => update("releases", releases)} />
          )}

          {step === 6 && (
            <ActionablesStep
              actionables={draft.actionables}
              onChange={(actionables) => update("actionables", actionables)}
            />
          )}

          {step === 7 && <ReviewStep draft={draft} />}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--bp-border)] px-5 py-4">
          <Button kind="outline" size="sm" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            ← Anterior
          </Button>
          {step < STEPS.length - 1 ? (
            <Button kind="primary" size="sm" onClick={() => setStep((s) => s + 1)} disabled={!canProceed}>
              Siguiente →
            </Button>
          ) : (
            <Button kind="primary" size="sm" onClick={handleSubmit}>
              {mode === "create" ? "Crear proyecto" : "Guardar cambios"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function TeamStep({
  team,
  qaLead,
  onChangeTeam,
  onChangeQaLead,
}: {
  team: TeamMember[];
  qaLead: string;
  onChangeTeam: (team: TeamMember[]) => void;
  onChangeQaLead: (qaLead: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className={labelClass()}>QA Lead</label>
        <input
          className={inputClass()}
          value={qaLead}
          onChange={(e) => onChangeQaLead(e.target.value)}
          placeholder="Nombre del QA Lead"
        />
      </div>
      <label className={labelClass()}>Equipo asignado</label>
      <div className="flex flex-col gap-2">
        {team.map((member, i) => (
          <div key={i} className="flex gap-2">
            <input
              className={inputClass()}
              value={member.name}
              onChange={(e) => {
                const next = [...team];
                next[i] = { ...next[i], name: e.target.value };
                onChangeTeam(next);
              }}
              placeholder="Nombre completo"
            />
            <input
              className={inputClass()}
              value={member.role}
              onChange={(e) => {
                const next = [...team];
                next[i] = { ...next[i], role: e.target.value };
                onChangeTeam(next);
              }}
              placeholder="Rol (ej. QA Engineer)"
            />
            <button
              type="button"
              onClick={() => onChangeTeam(team.filter((_, j) => j !== i))}
              className="shrink-0 rounded-[var(--bp-radius-sm)] px-2 text-[var(--bp-ink-soft)] hover:bg-[var(--bp-surface-alt)]"
              aria-label="Quitar"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <Button
        kind="outline"
        size="sm"
        onClick={() => onChangeTeam([...team, { name: "", role: "QA Engineer" }])}
        className="self-start"
      >
        + Añadir integrante
      </Button>
    </div>
  );
}

function ReleasesStep({
  releases,
  onChange,
}: {
  releases: Release[];
  onChange: (releases: Release[]) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <label className={labelClass()}>Épicas y releases importantes</label>
      <div className="flex flex-col gap-2">
        {releases.map((r, i) => (
          <div key={i} className="flex gap-2">
            <select
              className={`${inputClass()} w-28 shrink-0`}
              value={r.type}
              onChange={(e) => {
                const next = [...releases];
                next[i] = { ...next[i], type: e.target.value as Release["type"] };
                onChange(next);
              }}
            >
              <option value="release">Release</option>
              <option value="epic">Epic</option>
            </select>
            <input
              className={inputClass()}
              value={r.label}
              onChange={(e) => {
                const next = [...releases];
                next[i] = { ...next[i], label: e.target.value };
                onChange(next);
              }}
              placeholder="Ej. Release 1.0 – Lanzamiento"
            />
            <input
              type="date"
              className={`${inputClass()} w-40 shrink-0`}
              value={r.date}
              onChange={(e) => {
                const next = [...releases];
                next[i] = { ...next[i], date: e.target.value };
                onChange(next);
              }}
            />
            <button
              type="button"
              onClick={() => onChange(releases.filter((_, j) => j !== i))}
              className="shrink-0 rounded-[var(--bp-radius-sm)] px-2 text-[var(--bp-ink-soft)] hover:bg-[var(--bp-surface-alt)]"
              aria-label="Quitar"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <Button
        kind="outline"
        size="sm"
        onClick={() =>
          onChange([...releases, { label: "", date: new Date().toISOString().slice(0, 10), type: "release" }])
        }
        className="self-start"
      >
        + Añadir release/epic
      </Button>
    </div>
  );
}

function ActionablesStep({
  actionables,
  onChange,
}: {
  actionables: Actionable[];
  onChange: (actionables: Actionable[]) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <label className={labelClass()}>Accionables</label>
      <div className="flex flex-col gap-2">
        {actionables.map((a, i) => (
          <div key={i} className="flex flex-wrap gap-2 rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] p-2.5">
            <input
              className={`${inputClass()} flex-1`}
              value={a.title}
              onChange={(e) => {
                const next = [...actionables];
                next[i] = { ...next[i], title: e.target.value };
                onChange(next);
              }}
              placeholder="Título del accionable"
            />
            <input
              className={`${inputClass()} w-36`}
              value={a.owner}
              onChange={(e) => {
                const next = [...actionables];
                next[i] = { ...next[i], owner: e.target.value };
                onChange(next);
              }}
              placeholder="Dueño"
            />
            <input
              type="date"
              className={`${inputClass()} w-36`}
              value={a.due}
              onChange={(e) => {
                const next = [...actionables];
                next[i] = { ...next[i], due: e.target.value };
                onChange(next);
              }}
            />
            <select
              className={`${inputClass()} w-24`}
              value={a.priority}
              onChange={(e) => {
                const next = [...actionables];
                next[i] = { ...next[i], priority: e.target.value as Priority };
                onChange(next);
              }}
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-[12px] text-[var(--bp-ink-soft)]">
              <input
                type="checkbox"
                checked={a.done}
                onChange={(e) => {
                  const next = [...actionables];
                  next[i] = { ...next[i], done: e.target.checked };
                  onChange(next);
                }}
              />
              Hecho
            </label>
            <button
              type="button"
              onClick={() => onChange(actionables.filter((_, j) => j !== i))}
              className="shrink-0 rounded-[var(--bp-radius-sm)] px-2 text-[var(--bp-ink-soft)] hover:bg-[var(--bp-surface-alt)]"
              aria-label="Quitar"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <Button
        kind="outline"
        size="sm"
        onClick={() =>
          onChange([
            ...actionables,
            { title: "", owner: "", due: new Date().toISOString().slice(0, 10), priority: "Media", done: false },
          ])
        }
        className="self-start"
      >
        + Añadir accionable
      </Button>
    </div>
  );
}

function ReviewStep({ draft }: { draft: Draft }) {
  const severity = draft.bugsBySeverity;
  const bugsOpen = severity.critical + severity.high + severity.medium + severity.low;
  return (
    <div className="flex flex-col gap-3 text-[13px] text-[var(--bp-ink)]">
      <p className="text-[12px] text-[var(--bp-ink-soft)]">
        Revisa la información antes de guardar. Puedes volver a cualquier paso anterior para corregir algo.
      </p>
      <div className="rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] p-3">
        <div className="font-semibold">{draft.name || "(sin nombre)"}</div>
        <div className="text-[var(--bp-ink-soft)]">
          {draft.client || "(sin cliente)"} · {draft.category} · {draft.priority} · {draft.status}
        </div>
        <div className="mt-1 text-[var(--bp-ink-soft)]">
          {draft.startDate} → {draft.endDate}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] p-2.5">
          <div className="text-[11px] text-[var(--bp-ink-soft)]">Aprobación</div>
          <div className="font-semibold">{draft.passRate}%</div>
        </div>
        <div className="rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] p-2.5">
          <div className="text-[11px] text-[var(--bp-ink-soft)]">Cobertura</div>
          <div className="font-semibold">{draft.coverage}%</div>
        </div>
        <div className="rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] p-2.5">
          <div className="text-[11px] text-[var(--bp-ink-soft)]">Bugs abiertos</div>
          <div className="font-semibold">{bugsOpen}</div>
        </div>
      </div>
      <div className="text-[var(--bp-ink-soft)]">
        Equipo: {draft.team.length ? draft.team.map((t) => t.name).join(", ") : "sin asignar"}
      </div>
      <div className="text-[var(--bp-ink-soft)]">
        Releases/Épicas: {draft.releases.length} · Accionables: {draft.actionables.length}
      </div>
    </div>
  );
}

export default ProjectWizard;
