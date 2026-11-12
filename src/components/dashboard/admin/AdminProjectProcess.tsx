"use client";

import { useMemo, useState, type ReactNode } from "react";
import { checklistByPhase, STAGES } from "@/lib/procesoStages";
import { PROJECT_CATALOG, ownersOfProject, projectIdOf, type CatalogProject } from "@/lib/projectCatalog";
import { lastWeeks, mondayOf, todayInMexico } from "@/lib/projectHours";
import { useProjectProcess } from "@/lib/projectProcess";
import {
  checklistKey,
  EMPTY_CONTRACT,
  HANDOFF_ITEMS,
  HANDOFF_MARK_LABELS,
  REPORT_STATUS_LABELS,
  RISK_KIND_LABELS,
  RISK_SEVERITY_LABELS,
  STAGE_ORDER,
  type ContractData,
  type HandoffMark,
  type ProjectProcessData,
  type ReportStatus,
  type RiskKind,
  type RiskSeverity,
  type ScopeChangeStatus,
  type StageReport,
} from "@/lib/projectProcessTypes";
import { PROJECT_STATUS_LABELS, STRATEGISTS } from "@/lib/strategists";
import type { StageId } from "@/lib/procesoTypes";

const input = "w-full rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-2 py-1 text-[12px] text-[var(--bp-ink)] outline-none focus:border-[var(--bp-blue)]";
const btn = "bp-tap rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] px-2.5 py-1 text-[11px] font-semibold text-[var(--bp-ink)] hover:border-[var(--bp-blue)] disabled:opacity-50";
const NAME_BY_ID = new Map(STRATEGISTS.map((s) => [s.id, s.name]));

const uid = () => Math.random().toString(36).slice(2, 10);
const num = (v: string): number | null => (v.trim() === "" || Number.isNaN(Number(v)) ? null : Number(v));

function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">{label}</span>
      {children}
    </label>
  );
}

function Panel({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
      <h3 className="text-[13px] font-bold text-[var(--bp-ink)]">{title}</h3>
      {hint && <p className="mt-0.5 text-[11px] text-[var(--bp-ink-soft)]">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

const SECTIONS = [
  { id: "ficha", label: "Ficha y entregable de Comercial" },
  { id: "etapas", label: "Etapas y checklist" },
  { id: "objetivos", label: "Objetivos SMART" },
  { id: "riesgos", label: "Riesgos y alcance" },
  { id: "hito", label: "Hito semanal" },
  { id: "contrato", label: "Contrato y finanzas" },
  { id: "horas", label: "Horas y carga" },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

const GROUPS: { label: string; match: (p: CatalogProject) => boolean }[] = [
  { label: "Activos", match: (p) => p.status === "active" },
  { label: "Planeados y en pausa", match: (p) => p.status === "planned" || p.status === "paused" },
  { label: "Terminados e inactivos", match: (p) => p.status === "completed" || p.status === "inactive" },
];

export function AdminProjectProcess() {
  const { hydrated, storage } = useProjectProcess();
  const first = PROJECT_CATALOG.find((p) => p.status === "active") ?? PROJECT_CATALOG[0];
  const [projectId, setProjectId] = useState(projectIdOf(first));

  if (!hydrated) return <p className="text-[12px] text-[var(--bp-ink-soft)]">Cargando…</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Proyecto" className="min-w-[280px] flex-1 sm:max-w-md">
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={input}>
            {GROUPS.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {PROJECT_CATALOG.filter(g.match).map((p) => (
                  <option key={projectIdOf(p)} value={projectIdOf(p)}>
                    {p.code} · {p.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>
        <p className="pb-1 text-[11px] text-[var(--bp-ink-soft)]">{storage === "db" ? "Se guarda en la base de datos compartida." : "No hay base de datos conectada: se guarda solo en este navegador."}</p>
      </div>
      <ProjectEditor key={projectId} projectId={projectId} />
    </div>
  );
}

function ProjectEditor({ projectId }: { projectId: string }) {
  const { getProject, saveProject, saveError, jiraHours } = useProjectProcess();
  const project = PROJECT_CATALOG.find((p) => projectIdOf(p) === projectId)!;
  const saved = getProject(projectId);
  const [draft, setDraft] = useState<ProjectProcessData>(saved);
  const [section, setSection] = useState<SectionId>("ficha");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);
  const owners = ownersOfProject(project);
  const update = (patch: Partial<ProjectProcessData>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setStatus("idle");
  };

  async function save() {
    setStatus("saving");
    const ok = await saveProject(projectId, draft);
    setStatus(ok ? "saved" : "error");
  }

  const jiraProjectHours = (jiraHours?.rows ?? []).filter((r) => r.projectId === projectId).reduce((n, r) => n + r.hours, 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="text-[12px] text-[var(--bp-ink-soft)]">
        <span className="font-mono">{project.code}</span> · {project.client} · {project.cell} · {PROJECT_STATUS_LABELS[project.status]} · Equipo: {owners.length > 0 ? owners.map((id) => NAME_BY_ID.get(id) ?? id).join(", ") : "sin estratega asignado"}
      </div>

      <div role="tablist" aria-label="Secciones del proyecto" className="flex flex-wrap gap-1 border-b border-[var(--bp-border)] pb-2">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={section === s.id}
            onClick={() => setSection(s.id)}
            className={`bp-tap rounded-[var(--bp-radius-pill)] border px-3 py-1 text-[11px] font-semibold transition-colors ${section === s.id ? "border-[var(--bp-blue)] bg-[var(--bp-blue)]/10 text-[var(--bp-blue-600)]" : "border-[var(--bp-border)] text-[var(--bp-ink-soft)] hover:border-[var(--bp-blue)]"}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === "ficha" && <FichaSection draft={draft} update={update} />}
      {section === "etapas" && <EtapasSection draft={draft} update={update} />}
      {section === "objetivos" && <ObjetivosSection draft={draft} update={update} />}
      {section === "riesgos" && <RiesgosSection draft={draft} update={update} />}
      {section === "hito" && <HitoSection draft={draft} update={update} />}
      {section === "contrato" && <ContratoSection draft={draft} update={update} />}
      {section === "horas" && <HorasSection draft={draft} update={update} owners={owners} jiraHours={jiraProjectHours} />}

      <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center gap-3 border-t border-[var(--bp-border)] bg-[var(--bp-surface)]/95 px-1 py-3 backdrop-blur">
        <button type="button" onClick={save} disabled={!dirty || status === "saving"} className="bp-tap rounded-[var(--bp-radius-sm)] bg-[var(--bp-blue)] px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-[var(--bp-blue-600)] disabled:opacity-50">
          {status === "saving" ? "Guardando…" : "Guardar cambios"}
        </button>
        <button type="button" onClick={() => { setDraft(saved); setStatus("idle"); }} disabled={!dirty} className={btn}>
          Descartar
        </button>
        <span role="status" className="text-[11px] text-[var(--bp-ink-soft)]">
          {status === "saved" && !dirty ? "✓ Guardado" : dirty ? "Hay cambios sin guardar" : ""}
        </span>
        {(status === "error" || saveError) && <span role="alert" className="text-[11px] font-medium text-[var(--bp-danger)]">{saveError ?? "No se pudo guardar."}</span>}
      </div>
    </div>
  );
}

type SectionProps = { draft: ProjectProcessData; update: (patch: Partial<ProjectProcessData>) => void };

function FichaSection({ draft, update }: SectionProps) {
  const setLink = (k: keyof ProjectProcessData["links"], v: string) => update({ links: { ...draft.links, [k]: v } });
  const setMark = (id: (typeof HANDOFF_ITEMS)[number]["id"], v: string) => {
    const items = { ...draft.handoff.items };
    if (v === "") delete items[id];
    else items[id] = v as HandoffMark;
    update({ handoff: { ...draft.handoff, items } });
  };
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Ficha del proyecto" hint="Dónde vive todo lo del proyecto.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Etapa actual" className="sm:col-span-2">
            <select value={draft.stage} onChange={(e) => update({ stage: e.target.value as StageId })} className={input}>
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.number}. {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Carpeta de Drive">
            <input type="url" value={draft.links.drive} onChange={(e) => setLink("drive", e.target.value)} placeholder="https://drive.google.com/…" className={input} />
          </Field>
          <Field label="PRD">
            <input type="url" value={draft.links.prd} onChange={(e) => setLink("prd", e.target.value)} placeholder="https://…" className={input} />
          </Field>
          <Field label="README">
            <input type="url" value={draft.links.readme} onChange={(e) => setLink("readme", e.target.value)} placeholder="https://…" className={input} />
          </Field>
        </div>
      </Panel>

      <Panel title="Evaluación del entregable de Comercial" hint="Califica lo que Comercial entregó. Mide el handoff, no al estratega.">
        <div className="flex flex-col gap-2">
          {HANDOFF_ITEMS.map((i) => (
            <div key={i.id} className="flex items-center justify-between gap-3 text-[12px]">
              <span className="text-[var(--bp-ink)]">{i.label}</span>
              <select value={draft.handoff.items[i.id] ?? ""} onChange={(e) => setMark(i.id, e.target.value)} className={`${input} w-32`} aria-label={i.label}>
                <option value="">Sin evaluar</option>
                {(Object.keys(HANDOFF_MARK_LABELS) as HandoffMark[]).map((m) => (
                  <option key={m} value={m}>
                    {HANDOFF_MARK_LABELS[m]}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <Field label="Faltantes devueltos a Comercial / notas">
            <textarea value={draft.handoff.notes} onChange={(e) => update({ handoff: { ...draft.handoff, notes: e.target.value } })} rows={2} className={input} />
          </Field>
          <Field label="Fecha de la evaluación">
            <input type="date" value={draft.handoff.reviewedOn ?? ""} onChange={(e) => update({ handoff: { ...draft.handoff, reviewedOn: e.target.value || null } })} className={`${input} w-40`} />
          </Field>
        </div>
      </Panel>
    </div>
  );
}

const blankReport = (): StageReport => ({ status: "pendiente", dueDate: null, sentDate: null, decisionDate: null, acceptedBy: "", notes: "" });

function EtapasSection({ draft, update }: SectionProps) {
  const today = todayInMexico();
  const setReport = (stage: StageId, patch: Partial<StageReport>) => {
    const current = draft.reports[stage] ?? blankReport();
    const next = { ...current, ...patch };
    // Moving a report forward fills the matching date with today so it doesn't have to be typed.
    if (patch.status === "enviado" && !next.sentDate) next.sentDate = today;
    if (patch.status && ["aceptado", "aceptado_obs", "no_aceptado"].includes(patch.status) && !next.decisionDate) next.decisionDate = today;
    update({ reports: { ...draft.reports, [stage]: next } });
  };
  const toggle = (key: string) => {
    const checklist = { ...draft.checklist };
    if (checklist[key]) delete checklist[key];
    else checklist[key] = true;
    update({ checklist });
  };

  return (
    <div className="flex flex-col gap-3">
      {STAGE_ORDER.map((id) => {
        const stage = STAGES.find((s) => s.id === id)!;
        const r = draft.reports[id] ?? blankReport();
        const total = stage.checklist.reduce((n, g) => n + g.items.length, 0);
        const done = stage.checklist.reduce((n, g) => n + g.items.filter((i) => draft.checklist[checklistKey(id, i)]).length, 0);
        return (
          <Panel key={id} title={`${stage.number}. ${stage.name} · ${stage.deliverable.title}`} hint={`Checklist ${done}/${total}`}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Estado del reporte">
                <select value={r.status} onChange={(e) => setReport(id, { status: e.target.value as ReportStatus })} className={input}>
                  {(Object.keys(REPORT_STATUS_LABELS) as ReportStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {REPORT_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Fecha límite del reporte">
                <input type="date" value={r.dueDate ?? ""} onChange={(e) => setReport(id, { dueDate: e.target.value || null })} className={input} />
              </Field>
              <Field label="Enviado al cliente">
                <input type="date" value={r.sentDate ?? ""} onChange={(e) => setReport(id, { sentDate: e.target.value || null })} className={input} />
              </Field>
              <Field label="Fecha de respuesta">
                <input type="date" value={r.decisionDate ?? ""} onChange={(e) => setReport(id, { decisionDate: e.target.value || null })} className={input} />
              </Field>
              <Field label="Acepta (nombre y cargo)" className="sm:col-span-2">
                <input type="text" value={r.acceptedBy} onChange={(e) => setReport(id, { acceptedBy: e.target.value })} className={input} />
              </Field>
              <Field label="Observaciones del cliente" className="sm:col-span-2">
                <input type="text" value={r.notes} onChange={(e) => setReport(id, { notes: e.target.value })} className={input} />
              </Field>
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-[12px] font-semibold text-[var(--bp-blue-600)]">Checklist de la etapa ({done}/{total})</summary>
              <div className="mt-2 flex flex-col gap-4">
                {checklistByPhase(stage).map((phase) => (
                  <div key={phase.id}>
                    <h4 className="border-b border-[var(--bp-border)] pb-1 text-[12px] font-bold text-[var(--bp-ink)]">{phase.label}</h4>
                    <div className="mt-2 grid gap-4 md:grid-cols-2">
                      {phase.groups.map(({ group: g }) => {
                        const groupDone = g.items.filter((item) => draft.checklist[checklistKey(id, item)]).length;
                        return (
                          <fieldset key={g.title}>
                            <legend className="mb-1 flex w-full items-center justify-between gap-2 text-[11px] font-bold text-[var(--bp-ink-soft)]">
                              <span>{g.title}</span>
                              <span className="tabular-nums" aria-label={`${groupDone} de ${g.items.length} hechos`}>
                                {groupDone}/{g.items.length}
                              </span>
                            </legend>
                            <ul className="flex flex-col gap-1">
                              {g.items.map((item) => {
                                const key = checklistKey(id, item);
                                return (
                                  <li key={key}>
                                    <label className="flex cursor-pointer items-start gap-2 text-[12px] text-[var(--bp-ink)]">
                                      <input type="checkbox" checked={!!draft.checklist[key]} onChange={() => toggle(key)} className="mt-[3px] accent-[var(--bp-blue)]" />
                                      <span>{item}</span>
                                    </label>
                                  </li>
                                );
                              })}
                            </ul>
                          </fieldset>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </Panel>
        );
      })}
    </div>
  );
}

function ObjetivosSection({ draft, update }: SectionProps) {
  const set = (id: string, patch: Partial<ProjectProcessData["objectives"][number]>) => update({ objectives: draft.objectives.map((o) => (o.id === id ? { ...o, ...patch } : o)) });
  return (
    <Panel title="Objetivos SMART del business case" hint="Específicos, medibles, alcanzables, relevantes y con fecha. «Valor actual» se actualiza a mano mientras no haya analítica conectada.">
      <div className="flex flex-col gap-4">
        {draft.objectives.length === 0 && <p className="text-[12px] text-[var(--bp-ink-soft)]">Todavía no hay objetivos.</p>}
        {draft.objectives.map((o) => (
          <div key={o.id} className="grid gap-2 rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] p-3 sm:grid-cols-6">
            <Field label="Objetivo" className="sm:col-span-4">
              <input type="text" value={o.text} onChange={(e) => set(o.id, { text: e.target.value })} className={input} placeholder="Subir [métrica] de [línea base] a [meta] antes de [fecha]" />
            </Field>
            <Field label="Métrica" className="sm:col-span-2">
              <input type="text" value={o.metric} onChange={(e) => set(o.id, { metric: e.target.value })} className={input} />
            </Field>
            <Field label="Línea base">
              <input type="number" value={o.baseline ?? ""} onChange={(e) => set(o.id, { baseline: num(e.target.value) })} className={input} />
            </Field>
            <Field label="Valor actual">
              <input type="number" value={o.current ?? ""} onChange={(e) => set(o.id, { current: num(e.target.value) })} className={input} />
            </Field>
            <Field label="Meta">
              <input type="number" value={o.target ?? ""} onChange={(e) => set(o.id, { target: num(e.target.value) })} className={input} />
            </Field>
            <Field label="Unidad">
              <input type="text" value={o.unit} onChange={(e) => set(o.id, { unit: e.target.value })} className={input} placeholder="%, MXN, usuarios…" />
            </Field>
            <Field label="Fecha límite">
              <input type="date" value={o.dueDate ?? ""} onChange={(e) => set(o.id, { dueDate: e.target.value || null })} className={input} />
            </Field>
            <div className="flex items-end">
              <button type="button" onClick={() => update({ objectives: draft.objectives.filter((x) => x.id !== o.id) })} className={`${btn} text-[var(--bp-danger)]`}>
                Quitar
              </button>
            </div>
          </div>
        ))}
        <div>
          <button type="button" onClick={() => update({ objectives: [...draft.objectives, { id: uid(), text: "Nuevo objetivo", metric: "", unit: "", baseline: null, target: null, current: null, dueDate: null }] })} className={btn}>
            + Agregar objetivo
          </button>
        </div>
      </div>
    </Panel>
  );
}

function RiesgosSection({ draft, update }: SectionProps) {
  const today = todayInMexico();
  const [kind, setKind] = useState<RiskKind>("riesgo");
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<RiskSeverity>("media");
  const [owner, setOwner] = useState("");
  const [due, setDue] = useState("");
  const [change, setChange] = useState("");
  const [hours, setHours] = useState("");

  function addRisk() {
    if (title.trim() === "") return;
    update({ risks: [...draft.risks, { id: uid(), kind, title: title.trim(), severity, owner: owner.trim(), dueDate: due || null, status: "abierto", openedOn: today, closedOn: null }] });
    setTitle("");
    setOwner("");
    setDue("");
  }
  function addChange() {
    if (change.trim() === "") return;
    update({ scopeChanges: [...draft.scopeChanges, { id: uid(), title: change.trim(), impactHours: num(hours), status: "pendiente", date: today }] });
    setChange("");
    setHours("");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Riesgos, bloqueos y criticidades" hint="Una criticidad o un bloqueo de severidad alta pone el alcance del proyecto en rojo.">
        <div className="grid gap-2 sm:grid-cols-6">
          <Field label="Tipo" className="sm:col-span-2">
            <select value={kind} onChange={(e) => setKind(e.target.value as RiskKind)} className={input}>
              {(Object.keys(RISK_KIND_LABELS) as RiskKind[]).map((k) => (
                <option key={k} value={k}>
                  {RISK_KIND_LABELS[k]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Descripción" className="sm:col-span-4">
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={input} />
          </Field>
          <Field label="Severidad" className="sm:col-span-2">
            <select value={severity} onChange={(e) => setSeverity(e.target.value as RiskSeverity)} className={input}>
              {(Object.keys(RISK_SEVERITY_LABELS) as RiskSeverity[]).map((k) => (
                <option key={k} value={k}>
                  {RISK_SEVERITY_LABELS[k]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Dueño" className="sm:col-span-2">
            <input type="text" value={owner} onChange={(e) => setOwner(e.target.value)} className={input} />
          </Field>
          <Field label="Fecha límite" className="sm:col-span-2">
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={input} />
          </Field>
          <div className="sm:col-span-6">
            <button type="button" onClick={addRisk} disabled={title.trim() === ""} className={btn}>
              Agregar
            </button>
          </div>
        </div>
        <ul className="mt-4 flex flex-col gap-2">
          {draft.risks.length === 0 && <li className="text-[12px] text-[var(--bp-ink-soft)]">Nada registrado.</li>}
          {draft.risks.map((r) => (
            <li key={r.id} className={`flex flex-wrap items-center gap-2 text-[12px] ${r.status === "cerrado" ? "text-[var(--bp-ink-soft)] line-through" : "text-[var(--bp-ink)]"}`}>
              <span className="font-semibold">{RISK_KIND_LABELS[r.kind]}</span>
              <span>{r.title}</span>
              <span className="text-[11px] text-[var(--bp-ink-soft)] no-underline">
                · {RISK_SEVERITY_LABELS[r.severity]}
                {r.owner ? ` · ${r.owner}` : ""}
                {r.dueDate ? ` · vence ${r.dueDate}` : ""}
              </span>
              <button type="button" onClick={() => update({ risks: draft.risks.map((x) => (x.id === r.id ? { ...x, status: x.status === "abierto" ? "cerrado" : "abierto", closedOn: x.status === "abierto" ? today : null } : x)) })} className={btn}>
                {r.status === "abierto" ? "Cerrar" : "Reabrir"}
              </button>
              <button type="button" onClick={() => update({ risks: draft.risks.filter((x) => x.id !== r.id) })} className={`${btn} text-[var(--bp-danger)]`}>
                Quitar
              </button>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Cambios de alcance" hint="Se escriben en el reporte de la etapa y se aceptan antes de ejecutarse. Los aceptados suman a las horas del contrato.">
        <div className="grid gap-2 sm:grid-cols-6">
          <Field label="Cambio" className="sm:col-span-4">
            <input type="text" value={change} onChange={(e) => setChange(e.target.value)} className={input} />
          </Field>
          <Field label="Horas de impacto" className="sm:col-span-2">
            <input type="number" value={hours} onChange={(e) => setHours(e.target.value)} className={input} />
          </Field>
          <div className="sm:col-span-6">
            <button type="button" onClick={addChange} disabled={change.trim() === ""} className={btn}>
              Agregar
            </button>
          </div>
        </div>
        <ul className="mt-4 flex flex-col gap-2">
          {draft.scopeChanges.length === 0 && <li className="text-[12px] text-[var(--bp-ink-soft)]">Sin cambios de alcance.</li>}
          {draft.scopeChanges.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--bp-ink)]">
              <span>{c.title}</span>
              <span className="text-[11px] text-[var(--bp-ink-soft)]">{c.impactHours !== null ? `· ${c.impactHours} h` : ""} · {c.date}</span>
              <select value={c.status} onChange={(e) => update({ scopeChanges: draft.scopeChanges.map((x) => (x.id === c.id ? { ...x, status: e.target.value as ScopeChangeStatus } : x)) })} className={`${input} w-28`} aria-label={`Estado de ${c.title}`}>
                <option value="pendiente">Pendiente</option>
                <option value="aceptado">Aceptado</option>
                <option value="rechazado">Rechazado</option>
              </select>
              <button type="button" onClick={() => update({ scopeChanges: draft.scopeChanges.filter((x) => x.id !== c.id) })} className={`${btn} text-[var(--bp-danger)]`}>
                Quitar
              </button>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function HitoSection({ draft, update }: SectionProps) {
  const today = todayInMexico();
  const [week, setWeek] = useState(mondayOf(today));
  const current = draft.milestones[week];
  const weeks = Object.keys(draft.milestones).sort().reverse();
  const set = (patch: Partial<{ title: string; done: boolean }>) => {
    const next = { title: current?.title ?? "", done: current?.done ?? false, ...patch };
    const milestones = { ...draft.milestones };
    if (next.title.trim() === "") delete milestones[week];
    else milestones[week] = next;
    update({ milestones });
  };
  return (
    <Panel title="Hito clave de la semana" hint="Uno por semana: se define el lunes y se revisa el viernes con el cliente.">
      <div className="grid gap-3 sm:grid-cols-6">
        <Field label="Semana (cualquier día; se toma su lunes)" className="sm:col-span-2">
          <input type="date" value={week} onChange={(e) => e.target.value && setWeek(mondayOf(e.target.value))} className={input} />
        </Field>
        <Field label="Hito" className="sm:col-span-3">
          <input type="text" value={current?.title ?? ""} onChange={(e) => set({ title: e.target.value })} placeholder="Qué tiene que estar listo esta semana" className={input} />
        </Field>
        <label className="flex items-end gap-2 pb-1 text-[12px] text-[var(--bp-ink)]">
          <input type="checkbox" checked={current?.done ?? false} onChange={(e) => set({ done: e.target.checked })} disabled={!current} className="accent-[var(--bp-blue)]" />
          Cumplido
        </label>
      </div>
      {weeks.length > 0 && (
        <ul className="mt-4 flex flex-col gap-1 border-t border-[var(--bp-border)] pt-3">
          {weeks.map((w) => (
            <li key={w} className="flex items-center gap-2 text-[12px] text-[var(--bp-ink)]">
              <button type="button" onClick={() => setWeek(w)} className="font-mono text-[11px] text-[var(--bp-blue-600)] hover:underline">
                {w}
              </button>
              <span aria-hidden>{draft.milestones[w].done ? "✅" : "⏳"}</span>
              <span>{draft.milestones[w].title}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function ContratoSection({ draft, update }: SectionProps) {
  const c: ContractData = draft.contract ?? EMPTY_CONTRACT;
  const set = (patch: Partial<ContractData>) => update({ contract: { ...c, ...patch } });
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [due, setDue] = useState("");

  function addPayment() {
    const value = num(amount);
    if (label.trim() === "" || value === null) return;
    set({ payments: [...c.payments, { id: uid(), label: label.trim(), amount: value, dueDate: due || null, invoiced: false, paid: false }] });
    setLabel("");
    setAmount("");
    setDue("");
  }
  const setPayment = (id: string, patch: Partial<ContractData["payments"][number]>) => set({ payments: c.payments.map((p) => (p.id === id ? { ...p, ...patch } : p)) });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Contrato vendido" hint="La salud financiera del proyecto sale de aquí y de las horas ejecutadas.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Monto contratado">
            <input type="number" min={0} value={c.amount ?? ""} onChange={(e) => set({ amount: num(e.target.value) })} className={input} />
          </Field>
          <Field label="Moneda">
            <select value={c.currency} onChange={(e) => set({ currency: e.target.value as ContractData["currency"] })} className={input}>
              <option value="MXN">MXN</option>
              <option value="USD">USD</option>
            </select>
          </Field>
          <Field label="Horas contratadas">
            <input type="number" min={0} value={c.contractedHours ?? ""} onChange={(e) => set({ contractedHours: num(e.target.value) })} className={input} />
          </Field>
          <Field label="Enlace al contrato">
            <input type="url" value={c.contractUrl} onChange={(e) => set({ contractUrl: e.target.value })} placeholder="https://…" className={input} />
          </Field>
          <Field label="Inicio del contrato">
            <input type="date" value={c.startDate ?? ""} onChange={(e) => set({ startDate: e.target.value || null })} className={input} />
          </Field>
          <Field label="Fin del contrato">
            <input type="date" value={c.endDate ?? ""} onChange={(e) => set({ endDate: e.target.value || null })} className={input} />
          </Field>
          <div className="sm:col-span-2">
            <div className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">Semanas vendidas por etapa</div>
            <div className="mt-1 grid grid-cols-5 gap-2">
              {STAGES.map((s) => (
                <label key={s.id} className="flex flex-col gap-1 text-[10px] text-[var(--bp-ink-soft)]">
                  {s.name}
                  <input type="number" min={0} value={c.stageWeeks[s.id] ?? ""} onChange={(e) => set({ stageWeeks: { ...c.stageWeeks, [s.id]: num(e.target.value) ?? undefined } })} className={input} />
                </label>
              ))}
            </div>
          </div>
          <Field label="Notas del contrato" className="sm:col-span-2">
            <textarea value={c.notes} onChange={(e) => set({ notes: e.target.value })} rows={2} className={input} />
          </Field>
        </div>
      </Panel>

      <Panel title="Calendario de pagos" hint="Marca lo facturado y lo cobrado. Un pago vencido sin facturar o sin cobrar pone las finanzas en amarillo o rojo.">
        <div className="grid gap-2 sm:grid-cols-6">
          <Field label="Concepto" className="sm:col-span-2">
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Anticipo, entrega…" className={input} />
          </Field>
          <Field label="Monto" className="sm:col-span-2">
            <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} className={input} />
          </Field>
          <Field label="Vence" className="sm:col-span-1">
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={input} />
          </Field>
          <div className="flex items-end">
            <button type="button" onClick={addPayment} disabled={label.trim() === "" || num(amount) === null} className={btn}>
              Agregar
            </button>
          </div>
        </div>
        <ul className="mt-4 flex flex-col gap-2">
          {c.payments.length === 0 && <li className="text-[12px] text-[var(--bp-ink-soft)]">Sin pagos capturados.</li>}
          {c.payments.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 text-[12px] text-[var(--bp-ink)]">
              <span className="font-semibold">{p.label}</span>
              <span className="tabular-nums">{p.amount.toLocaleString("es-MX")} {c.currency}</span>
              <span className="text-[11px] text-[var(--bp-ink-soft)]">{p.dueDate ? `vence ${p.dueDate}` : "sin fecha"}</span>
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={p.invoiced} onChange={(e) => setPayment(p.id, { invoiced: e.target.checked, paid: e.target.checked ? p.paid : false })} className="accent-[var(--bp-blue)]" /> Facturado
              </label>
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={p.paid} onChange={(e) => setPayment(p.id, { paid: e.target.checked, invoiced: e.target.checked ? true : p.invoiced })} className="accent-[var(--bp-blue)]" /> Cobrado
              </label>
              <button type="button" onClick={() => set({ payments: c.payments.filter((x) => x.id !== p.id) })} className={`${btn} text-[var(--bp-danger)]`}>
                Quitar
              </button>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function HorasSection({ draft, update, owners, jiraHours }: SectionProps & { owners: string[]; jiraHours: number }) {
  const today = todayInMexico();
  const weeks = useMemo(() => lastWeeks(today, 8).reverse(), [today]);
  const people = useMemo(() => {
    const ids = new Set([...owners, ...Object.keys(draft.allocations), ...Object.values(draft.manualHours).flatMap((m) => Object.keys(m))]);
    return STRATEGISTS.filter((s) => ids.has(s.id));
  }, [owners, draft.allocations, draft.manualHours]);
  const [extra, setExtra] = useState("");

  const setAllocation = (id: string, v: string) => {
    const allocations = { ...draft.allocations };
    const n = num(v);
    if (n === null || n === 0) delete allocations[id];
    else allocations[id] = n;
    update({ allocations });
  };
  const setHours = (week: string, id: string, v: string) => {
    const n = num(v);
    const manualHours = { ...draft.manualHours, [week]: { ...(draft.manualHours[week] ?? {}) } };
    if (n === null || n === 0) delete manualHours[week][id];
    else manualHours[week][id] = n;
    if (Object.keys(manualHours[week]).length === 0) delete manualHours[week];
    update({ manualHours });
  };
  const addable = STRATEGISTS.filter((s) => !people.some((p) => p.id === s.id));

  return (
    <Panel title="Horas y carga del equipo en este proyecto" hint="Mientras el equipo no registre tiempo en Jira, las horas se capturan aquí por semana. Si Jira tiene horas de esa persona en esa semana, usa las de Jira.">
      <p className="mb-3 text-[12px] text-[var(--bp-ink-soft)]">Horas de este proyecto registradas en Jira (todo el equipo): <span className="font-semibold text-[var(--bp-ink)]">{Math.round(jiraHours)} h</span></p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-[12px]">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
              <th className="py-1 pr-3 font-semibold">Semana (lunes)</th>
              {people.map((s) => (
                <th key={s.id} className="px-2 py-1 font-semibold">
                  {s.name.split(" ")[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-[var(--bp-border)] bg-[var(--bp-surface-alt)]/50">
              <td className="py-1.5 pr-3 font-semibold text-[var(--bp-ink)]">Planeado (h por semana)</td>
              {people.map((s) => (
                <td key={s.id} className="px-2 py-1">
                  <input type="number" min={0} max={80} value={draft.allocations[s.id] ?? ""} onChange={(e) => setAllocation(s.id, e.target.value)} className={`${input} w-20`} aria-label={`Horas planeadas por semana de ${s.name}`} />
                </td>
              ))}
            </tr>
            {weeks.map((w) => (
              <tr key={w} className="border-t border-[var(--bp-border)]">
                <td className="py-1.5 pr-3 font-mono text-[11px] text-[var(--bp-ink-soft)]">{w}</td>
                {people.map((s) => (
                  <td key={s.id} className="px-2 py-1">
                    <input type="number" min={0} max={168} step={0.5} value={draft.manualHours[w]?.[s.id] ?? ""} onChange={(e) => setHours(w, s.id, e.target.value)} className={`${input} w-20`} aria-label={`Horas de ${s.name} la semana del ${w}`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {addable.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <select value={extra} onChange={(e) => setExtra(e.target.value)} className={`${input} w-56`} aria-label="Agregar persona a la tabla">
            <option value="">Agregar otra persona…</option>
            {addable.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button type="button" disabled={extra === ""} onClick={() => { setAllocation(extra, String(0.5)); setExtra(""); }} className={btn}>
            Agregar
          </button>
          <span className="text-[11px] text-[var(--bp-ink-soft)]">Se agrega con 0.5 h planeadas; ajústalo.</span>
        </div>
      )}
      <p className="mt-3 text-[11px] text-[var(--bp-ink-soft)]">Se muestran las últimas 8 semanas.</p>
    </Panel>
  );
}

export default AdminProjectProcess;
