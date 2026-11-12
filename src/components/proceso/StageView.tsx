"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AcceptanceDocument from "@/components/proceso/AcceptanceDocument";
import ExportMenu from "@/components/proceso/ExportMenu";
import SegmentedTabs from "@/components/proceso/SegmentedTabs";
import { SkillsPanel, SopsPanel } from "@/components/proceso/StageTabsInfo";
import StageFiles from "@/components/proceso/StageFiles";
import StageTimeline from "@/components/proceso/StageTimeline";
import { STAGE_STYLE } from "@/components/proceso/procesoUi";
import { useHashTab } from "@/components/proceso/useHashTab";
import { usePrintSheet } from "@/components/proceso/usePrintSheet";
import PageContainer from "@/components/site/PageContainer";
import { stageHref } from "@/components/site/siteNav";
import Badge from "@/components/ui/Badge";
import { checklistItemId, useProcessChecklist } from "@/lib/procesoChecklist";
import { stageMarkdownDocument } from "@/lib/procesoMarkdown";
import { checklistByPhase, checklistTotal, STAGES } from "@/lib/procesoStages";
import type { ExampleStatus, StageId } from "@/lib/procesoTypes";

const TABS = [
  { id: "proceso", label: "Proceso" },
  { id: "checklist", label: "Checklist" },
  { id: "archivos", label: "Archivos" },
  { id: "sops", label: "SOPs" },
  { id: "skills", label: "Skills" },
  { id: "aceptacion", label: "Aceptación" },
  { id: "herramientas", label: "Herramientas" },
  { id: "tips", label: "Tips" },
];
const TAB_IDS = TABS.map((t) => t.id);

const EXAMPLE_BADGE: Record<ExampleStatus, { label: string; color: "info" | "warning" } | null> = {
  confirmado: null,
  candidato: { label: "Candidato", color: "info" },
  "por-elegir": { label: "Por elegir", color: "warning" },
};

const h3 = "text-[13px] font-bold text-[var(--bp-ink)]";

/** One stage as its own site: header and timeline on top, SOPs and skills on the left, and the stage's information in tabs. */
export default function StageView({ stageId }: { stageId: StageId }) {
  const index = STAGES.findIndex((s) => s.id === stageId);
  const stage = STAGES[index];
  const { color } = STAGE_STYLE[stage.id];
  const { done, toggle, reset } = useProcessChecklist();
  const { printNode, printMarkdown, sheet } = usePrintSheet();
  const [tab, setTab] = useHashTab(TAB_IDS, "proceso");
  const [showDoc, setShowDoc] = useState(false);
  const prev = STAGES[index - 1];
  const next = STAGES[index + 1];

  const total = checklistTotal(stage);
  const checked = useMemo(() => stage.checklist.reduce((n, g, gi) => n + g.items.filter((_, ii) => done[checklistItemId(stage.id, gi, ii)]).length, 0), [stage, done]);
  const pct = total === 0 ? 0 : Math.round((checked / total) * 100);
  const phases = useMemo(() => checklistByPhase(stage), [stage]);
  const prefix = `res-${stage.id}`;

  return (
    <>
      <div className="print:hidden">
        <PageContainer>
          <div className="flex flex-col gap-6 bp-anim-page">
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-3xl font-bold text-[var(--bp-ink)]">
                  <span className="mr-2 inline-flex h-9 w-9 items-center justify-center rounded-full border-2 align-middle text-[16px]" style={{ borderColor: color }}>
                    {stage.number}
                  </span>
                  {stage.name}
                </h1>
                <p className="mt-2 max-w-[65ch] text-[15px] font-semibold leading-snug text-[var(--bp-ink)]">{stage.goal}</p>
              </div>
              <ExportMenu subject={`la etapa ${stage.name}`} filename={`proceso-estrategas-${stage.number}-${stage.id}`} getMarkdown={() => stageMarkdownDocument(stage)} onPdf={printMarkdown} />
            </header>

            <div className="rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-4 py-4">
              <StageTimeline current={stage.id} />
            </div>

            <div className="min-w-0 rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] bg-[var(--bp-surface)]">
                <div className="px-2">
                  <SegmentedTabs tabs={TABS} value={tab} onChange={setTab} idPrefix={prefix} label={`Información de ${stage.name}`} />
                </div>
                <div key={tab} role="tabpanel" id={`${prefix}-panel-${tab}`} aria-labelledby={`${prefix}-tab-${tab}`} className="bp-row-in p-4 sm:p-5">
                  {tab === "proceso" && (
                    <div className="flex flex-col gap-4">
                      <div className="flex max-w-[68ch] flex-col gap-2 text-[14px] leading-relaxed text-[var(--bp-ink)]">
                        {stage.summary.map((p) => (
                          <p key={p}>{p}</p>
                        ))}
                      </div>
                      <p className="max-w-[68ch] text-[13px] leading-relaxed text-[var(--bp-ink)]">
                        <span className="font-semibold">Ritmo: </span>
                        {stage.rhythm}
                      </p>
                      {stage.parallel && (
                        <div className="rounded-[var(--bp-radius-md)] bg-[var(--bp-blue-tint)] p-4">
                          <h3 className={h3}>En paralelo: {stage.parallel.title}</h3>
                          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-[13px] leading-snug text-[var(--bp-ink)]">
                            {stage.parallel.points.map((p) => (
                              <li key={p}>{p}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {tab === "checklist" && (
                    <div>
                      <div className="flex flex-wrap items-center gap-3 pb-3">
                        <div className="h-1.5 min-w-[140px] flex-1 rounded-full bg-[var(--bp-surface-alt)]">
                          <div role="progressbar" aria-label={`Avance del checklist de ${stage.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="bp-bar h-full rounded-full transition-[width] duration-[var(--bp-dur)] motion-reduce:transition-none" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                        <span className="text-[12px] font-semibold tabular-nums text-[var(--bp-ink)]">
                          {checked}/{total}
                        </span>
                        {checked > 0 && (
                          <button type="button" onClick={() => reset(stage.id)} className="ml-auto text-[12px] font-semibold text-[var(--bp-blue-600)] underline-offset-2 hover:underline">
                            Limpiar marcas
                          </button>
                        )}
                      </div>
                      <div className="flex flex-col gap-6">
                        {phases.map((phase, pi) => {
                          const phaseTotal = phase.groups.reduce((n, { group }) => n + group.items.length, 0);
                          const phaseDone = phase.groups.reduce((n, { group, index }) => n + group.items.filter((_, ii) => done[checklistItemId(stage.id, index, ii)]).length, 0);
                          return (
                            <section key={phase.id} aria-labelledby={`${prefix}-phase-${phase.id}`}>
                              <h3 id={`${prefix}-phase-${phase.id}`} className="flex items-center gap-2 border-b border-[var(--bp-border)] pb-1.5 text-[13px] font-bold text-[var(--bp-ink)]">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full text-[11px]" style={{ backgroundColor: `color-mix(in srgb, ${color} 26%, white)` }}>
                                  {pi + 1}
                                </span>
                                {phase.label}
                                <span className="ml-auto text-[12px] font-semibold tabular-nums text-[var(--bp-ink-soft)]" aria-label={`${phaseDone} de ${phaseTotal} en esta fase`}>
                                  {phaseDone}/{phaseTotal}
                                </span>
                              </h3>
                              <div className="mt-3 grid gap-x-8 gap-y-4 xl:grid-cols-2">
                                {phase.groups.map(({ group, index: gi }) => {
                                  const groupDone = group.items.filter((_, ii) => done[checklistItemId(stage.id, gi, ii)]).length;
                                  const groupPct = Math.round((groupDone / group.items.length) * 100);
                                  return (
                                    <fieldset key={group.title}>
                                      <legend className="mb-1 flex w-full items-center gap-2 text-[12px] font-bold text-[var(--bp-ink)]">
                                        <span>{group.title}</span>
                                        <span className="flex flex-1 items-center gap-2">
                                          <span className="h-1 min-w-[40px] flex-1 rounded-full bg-[var(--bp-surface-alt)]">
                                            <span className="bp-bar block h-full rounded-full transition-[width] duration-[var(--bp-dur)] motion-reduce:transition-none" style={{ width: `${groupPct}%`, backgroundColor: color }} />
                                          </span>
                                          <span className="text-[11px] font-semibold tabular-nums text-[var(--bp-ink-soft)]" aria-label={`${groupDone} de ${group.items.length} hechos`}>
                                            {groupDone}/{group.items.length}
                                          </span>
                                        </span>
                                      </legend>
                                      <ul className="flex flex-col">
                                        {group.items.map((item, ii) => {
                                          const id = checklistItemId(stage.id, gi, ii);
                                          return (
                                            <li key={id}>
                                              <label className="flex cursor-pointer items-start gap-2.5 rounded-[var(--bp-radius-sm)] px-1.5 py-1 text-[13px] leading-snug text-[var(--bp-ink)] transition-colors duration-[var(--bp-dur-fast)] hover:bg-[var(--bp-surface-alt)]">
                                                <input type="checkbox" checked={!!done[id]} onChange={() => toggle(id)} className="mt-[3px] h-3.5 w-3.5 shrink-0 accent-[var(--bp-blue)]" />
                                                <span className={done[id] ? "text-[var(--bp-ink-soft)] line-through" : ""}>{item}</span>
                                              </label>
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    </fieldset>
                                  );
                                })}
                              </div>
                            </section>
                          );
                        })}
                      </div>
                      <p className="mt-4 text-[11px] text-[var(--bp-ink-soft)]">Marcas de práctica, solo en este navegador. El checklist real de cada proyecto se captura en Admin.</p>
                    </div>
                  )}

                  {tab === "archivos" && <StageFiles stage={stage} done={done} toggle={toggle} />}

                  {tab === "sops" && <SopsPanel stage={stage} />}

                  {tab === "skills" && <SkillsPanel stage={stage} />}

                  {tab === "aceptacion" && (
                    <div className="flex flex-col gap-4">
                      <div>
                        <h3 className={h3}>{stage.deliverable.title}</h3>
                        <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-[13px] leading-snug text-[var(--bp-ink)]">
                          {stage.deliverable.contents.map((c) => (
                            <li key={c}>{c}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[480px] border-collapse text-[12px]">
                          <thead>
                            <tr className="border-b border-[var(--bp-border)] text-left text-[11px] text-[var(--bp-ink-soft)]">
                              <th className="py-1.5 pr-4 font-semibold">Criterio</th>
                              <th className="py-1.5 font-semibold">Evidencia</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stage.deliverable.criteria.map((c) => (
                              <tr key={c.criterion} className="border-b border-[var(--bp-border)] align-top last:border-0">
                                <td className="py-2 pr-4 font-medium text-[var(--bp-ink)]">{c.criterion}</td>
                                <td className="py-2 text-[var(--bp-ink-soft)]">{c.evidence}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => setShowDoc((v) => !v)} aria-expanded={showDoc} className="bp-tap rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] px-3 py-1.5 text-[12px] font-semibold text-[var(--bp-ink)] transition-colors hover:border-[var(--bp-blue)]">
                          {showDoc ? "Ocultar formato" : "Ver formato completo"}
                        </button>
                        <button type="button" onClick={() => printNode(<AcceptanceDocument stage={stage} />, `aceptacion-${stage.id}`)} className="bp-tap rounded-[var(--bp-radius-md)] bg-[var(--bp-blue)] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[var(--bp-blue-600)]">
                          Imprimir o guardar PDF
                        </button>
                      </div>
                      {showDoc && <AcceptanceDocument stage={stage} />}
                    </div>
                  )}

                  {tab === "herramientas" && (
                    <div className="grid gap-6 xl:grid-cols-2">
                      <div>
                        <h3 className={h3}>Herramientas</h3>
                        <dl className="mt-2 divide-y divide-[var(--bp-border)]">
                          {stage.tools.map((t) => (
                            <div key={t.name} className="flex gap-3 py-1.5 text-[12px]">
                              <dt className="w-32 shrink-0 font-semibold text-[var(--bp-ink)]">{t.name}</dt>
                              <dd className="text-[var(--bp-ink-soft)]">{t.use}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                      <div>
                        <h3 className={h3}>Agentes por construir</h3>
                        <ul className="mt-2 divide-y divide-[var(--bp-border)]">
                          {stage.agents.map((a) => (
                            <li key={a.name} className="py-2 text-[12px] leading-snug">
                              <p className="font-semibold text-[var(--bp-ink)]">{a.name}</p>
                              <p className="text-[var(--bp-ink)]">{a.does}</p>
                              <p className="text-[var(--bp-ink-soft)]">Revisión humana: {a.humanCheck}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {tab === "tips" && (
                    <div className="grid gap-6 xl:grid-cols-2">
                      <div>
                        <h3 className={h3}>Tips</h3>
                        <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-[13px] leading-snug text-[var(--bp-ink)]">
                          {stage.tips.map((t) => (
                            <li key={t}>{t}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className={h3}>Ejemplos</h3>
                        <ul className="mt-2 flex flex-col divide-y divide-[var(--bp-border)]">
                          {stage.examples.map((e) => {
                            const badge = EXAMPLE_BADGE[e.status ?? (e.href ? "confirmado" : "por-elegir")];
                            return (
                              <li key={e.title} className="py-2 text-[13px]">
                                <div className="flex flex-wrap items-center gap-2">
                                  {e.href ? (
                                    <Link href={e.href} className="font-semibold text-[var(--bp-blue-600)] hover:underline">
                                      {e.title}
                                    </Link>
                                  ) : (
                                    <span className="font-semibold text-[var(--bp-ink)]">{e.title}</span>
                                  )}
                                  {badge && (
                                    <Badge color={badge.color} dot={false}>
                                      {badge.label}
                                    </Badge>
                                  )}
                                </div>
                                <p className="mt-0.5 text-[12px] text-[var(--bp-ink-soft)]">{e.note}</p>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
            </div>

            <nav aria-label="Etapa anterior y siguiente" className="grid gap-3 sm:grid-cols-2">
              <Link href={prev ? stageHref(prev.id) : "/"} className="bp-lift group flex flex-col rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-4 py-3">
                <span className="text-[11px] text-[var(--bp-ink-soft)]">Anterior</span>
                <span className="text-[14px] font-bold text-[var(--bp-ink)]">← {prev ? `${prev.number}. ${prev.name}` : "Inicio"}</span>
              </Link>
              <Link href={next ? stageHref(next.id) : "/dashboard-estrategas"} className="bp-lift group flex flex-col rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-4 py-3 sm:text-right">
                <span className="text-[11px] text-[var(--bp-ink-soft)]">Siguiente</span>
                <span className="text-[14px] font-bold text-[var(--bp-ink)]">{next ? `${next.number}. ${next.name}` : "Dashboard de resultados"} →</span>
              </Link>
            </nav>
          </div>
        </PageContainer>
      </div>
      {sheet}
    </>
  );
}
