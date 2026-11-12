"use client";

import type { ReactNode } from "react";
import HealthDot from "@/components/dashboard/HealthDot";
import { StageTrack } from "@/components/dashboard/StageTrack";
import Badge, { type BadgeColor } from "@/components/ui/Badge";
import { STAGES } from "@/lib/procesoStages";
import { stageChecklist } from "@/lib/processMetrics";
import { PROJECT_STATUS_LABELS, STRATEGISTS } from "@/lib/strategists";
import { HANDOFF_ITEMS, HANDOFF_MARK_LABELS, REPORT_STATUS_LABELS, RISK_KIND_LABELS, STAGE_ORDER, type ReportStatus } from "@/lib/projectProcessTypes";
import type { HoursModel } from "@/lib/projectHours";
import type { ProjectRow } from "@/lib/useProjectsView";

const NAME_BY_ID = new Map(STRATEGISTS.map((s) => [s.id, s.name]));
const REPORT_COLOR: Record<ReportStatus, BadgeColor> = { pendiente: "neutral", enviado: "info", aceptado: "success", aceptado_obs: "warning", no_aceptado: "danger" };

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export function shortDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}${y !== new Date().getFullYear() ? ` ${y}` : ""}`;
}

export function money(amount: number, currency: string): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function Card({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4 ${className}`}>
      <h4 className="text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--bp-ink-soft)]">{title}</h4>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

function Bar({ pct, color = "var(--bp-blue)", label }: { pct: number; color?: string; label: string }) {
  const value = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bp-surface-alt)]">
      <div className="bp-bar h-full rounded-full transition-[width] duration-[var(--bp-dur)]" style={{ width: `${value}%`, backgroundColor: color }} />
    </div>
  );
}

const Empty = ({ children }: { children: ReactNode }) => <p className="text-[12px] text-[var(--bp-ink-soft)]">{children}</p>;

const safeLink = (u: string) => (/^https?:\/\//i.test(u) ? u : null);

export function ProjectDetail({ row, hours, week, today }: { row: ProjectRow; hours: HoursModel; week: string; today: string }) {
  const { project, data, health, owners, boards } = row;
  const contract = data.contract;
  const links = [
    ["Carpeta de Drive", safeLink(data.links.drive)],
    ["PRD", safeLink(data.links.prd)],
    ["README", safeLink(data.links.readme)],
    ["Contrato", contract ? safeLink(contract.contractUrl) : null],
  ] as const;

  const invoiced = contract?.payments.filter((p) => p.invoiced).reduce((n, p) => n + p.amount, 0) ?? 0;
  const paid = contract?.payments.filter((p) => p.paid).reduce((n, p) => n + p.amount, 0) ?? 0;
  const handoffMarks = HANDOFF_ITEMS.map((i) => data.handoff.items[i.id]).filter((m) => m !== undefined);
  const handoffPct = handoffMarks.length === 0 ? null : Math.round((handoffMarks.reduce((n, m) => n + (m === "completo" ? 1 : m === "parcial" ? 0.5 : 0), 0) / handoffMarks.length) * 100);
  const milestone = data.milestones[week];
  const recentMilestones = Object.entries(data.milestones)
    .filter(([w]) => w !== week)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 4);
  const openRisks = data.risks.filter((r) => r.status === "abierto");

  return (
    <div className="flex flex-col gap-3 bg-[var(--bp-surface-alt)] p-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[var(--bp-ink-soft)]">
        <span>
          <span className="font-mono">{project.code}</span> · {project.cell} · {PROJECT_STATUS_LABELS[project.status]}
        </span>
        <span>
          {shortDate(project.start)} → {shortDate(project.end)}
        </span>
        <span>Equipo: {owners.length > 0 ? owners.map((id) => NAME_BY_ID.get(id) ?? id).join(", ") : "sin estratega asignado"}</span>
        {links.map(([label, href]) =>
          href ? (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--bp-blue-600)] underline-offset-2 hover:underline">
              {label} ↗
            </a>
          ) : null,
        )}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card title="Salud del proyecto">
          <ul className="flex flex-col gap-2">
            {(
              [
                ["Cronograma", health.schedule],
                ["Alcance", health.scope],
                ["Finanzas", health.finance],
              ] as const
            ).map(([label, p]) => (
              <li key={label}>
                <HealthDot light={p.light} label={label} />
                <p className="mt-0.5 pl-[18px] text-[11px] leading-snug text-[var(--bp-ink-soft)]">{p.reason}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Alertas abiertas" className="lg:col-span-2">
          {health.alerts.length === 0 ? (
            <Empty>Sin alertas.</Empty>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {health.alerts.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] text-[var(--bp-ink)]">
                  <Badge color={a.level === "medio" ? "warning" : "danger"} dot={false}>
                    {a.level === "critico" ? "Crítica" : a.level === "alto" ? "Alta" : "Media"}
                  </Badge>
                  <span className="leading-snug">{a.text}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Etapas del proceso">
        <div className="overflow-x-auto pb-1">
          <div className="min-w-[560px]">
            <StageTrack data={data} today={today} />
          </div>
        </div>
        <div className="mt-4 overflow-x-auto border-t border-[var(--bp-border)] pt-3">
          <table className="w-full min-w-[640px] border-collapse text-[12px]">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
                <th className="py-1 pr-3 font-semibold">Etapa</th>
                <th className="py-1 pr-3 font-semibold">Checklist</th>
                <th className="py-1 pr-3 font-semibold">Reporte de aceptación</th>
                <th className="py-1 pr-3 font-semibold">Entrega</th>
                <th className="py-1 font-semibold">Respuesta</th>
              </tr>
            </thead>
            <tbody>
              {STAGE_ORDER.map((id) => {
                const stage = STAGES.find((s) => s.id === id)!;
                const c = stageChecklist(data, id);
                const r = data.reports[id];
                const current = data.stage === id;
                return (
                  <tr key={id} className="border-t border-[var(--bp-border)] align-middle">
                    <td className="py-1.5 pr-3 font-semibold text-[var(--bp-ink)]">
                      {stage.number}. {stage.name} {current && <Badge color="info" dot={false}>Etapa actual</Badge>}
                    </td>
                    <td className="w-44 py-1.5 pr-3">
                      <div className="flex items-center gap-2">
                        <Bar pct={c.total ? (c.done / c.total) * 100 : 0} label={`Checklist de ${stage.name}`} />
                        <span className="shrink-0 tabular-nums text-[var(--bp-ink-soft)]">
                          {c.done}/{c.total}
                        </span>
                      </div>
                    </td>
                    <td className="py-1.5 pr-3">
                      <Badge color={REPORT_COLOR[r?.status ?? "pendiente"]}>{REPORT_STATUS_LABELS[r?.status ?? "pendiente"]}</Badge>
                    </td>
                    <td className="py-1.5 pr-3 text-[var(--bp-ink-soft)]">
                      {r?.dueDate ? `Fecha límite ${shortDate(r.dueDate)}` : "—"}
                      {r?.sentDate ? ` · enviado ${shortDate(r.sentDate)}` : ""}
                    </td>
                    <td className="py-1.5 text-[var(--bp-ink-soft)]">{r?.decisionDate ? `${shortDate(r.decisionDate)}${r.acceptedBy ? ` · ${r.acceptedBy}` : ""}` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card title="Objetivos SMART">
          {data.objectives.length === 0 ? (
            <Empty>Aún no hay objetivos registrados. Se definen en el Discovery.</Empty>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.objectives.map((o) => {
                const span = o.baseline !== null && o.target !== null ? o.target - o.baseline : null;
                const pct = span && o.current !== null && o.baseline !== null ? ((o.current - o.baseline) / span) * 100 : null;
                return (
                  <li key={o.id}>
                    <div className="text-[12px] font-medium leading-snug text-[var(--bp-ink)]">{o.text}</div>
                    <div className="mt-0.5 text-[11px] text-[var(--bp-ink-soft)]">
                      {o.metric ? `${o.metric}: ` : ""}
                      {o.baseline ?? "—"} → {o.current ?? "—"} (meta {o.target ?? "—"}
                      {o.unit ? ` ${o.unit}` : ""}){o.dueDate ? ` · ${shortDate(o.dueDate)}` : ""}
                    </div>
                    {pct !== null && (
                      <div className="mt-1 flex items-center gap-2">
                        <Bar pct={pct} color="var(--bp-green)" label={`Avance de ${o.text}`} />
                        <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-[var(--bp-ink-soft)]">{Math.round(Math.max(0, pct))}%</span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="Hito clave de la semana">
          {milestone ? (
            <p className="flex items-start gap-2 text-[13px] text-[var(--bp-ink)]">
              <span aria-hidden>{milestone.done ? "✅" : "⏳"}</span>
              <span>
                {milestone.title} <span className="text-[11px] text-[var(--bp-ink-soft)]">({milestone.done ? "cumplido" : "en curso"})</span>
              </span>
            </p>
          ) : (
            <Empty>Esta semana no tiene hito definido.</Empty>
          )}
          {recentMilestones.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1 border-t border-[var(--bp-border)] pt-2">
              {recentMilestones.map(([w, m]) => (
                <li key={w} className="text-[11px] text-[var(--bp-ink-soft)]">
                  <span aria-hidden>{m.done ? "✅" : "✖"}</span> Semana del {shortDate(w)}: {m.title}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Riesgos, bloqueos y alcance">
          {openRisks.length === 0 && data.scopeChanges.length === 0 ? (
            <Empty>Nada abierto.</Empty>
          ) : (
            <ul className="flex flex-col gap-1.5 text-[12px] text-[var(--bp-ink)]">
              {openRisks.map((r) => (
                <li key={r.id} className="flex items-start gap-2">
                  <Badge color={r.kind === "riesgo" ? "warning" : "danger"} dot={false}>
                    {RISK_KIND_LABELS[r.kind]}
                  </Badge>
                  <span className="leading-snug">
                    {r.title}
                    <span className="text-[11px] text-[var(--bp-ink-soft)]">
                      {r.owner ? ` · ${r.owner}` : ""}
                      {r.dueDate ? ` · vence ${shortDate(r.dueDate)}` : ""}
                    </span>
                  </span>
                </li>
              ))}
              {data.scopeChanges.map((c) => (
                <li key={c.id} className="flex items-start gap-2">
                  <Badge color={c.status === "aceptado" ? "success" : c.status === "rechazado" ? "neutral" : "warning"} dot={false}>
                    Alcance
                  </Badge>
                  <span className="leading-snug">
                    {c.title}
                    <span className="text-[11px] text-[var(--bp-ink-soft)]">
                      {" "}
                      · {c.status}
                      {c.impactHours !== null ? ` · ${c.impactHours} h` : ""}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card title="Contrato y finanzas" className="lg:col-span-2">
          {!contract ? (
            <Empty>Falta capturar el contrato en Admin para ver la salud financiera.</Empty>
          ) : (
            <div className="flex flex-col gap-3 text-[12px]">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["Contratado", contract.amount === null ? "—" : money(contract.amount, contract.currency)],
                  ["Facturado", money(invoiced, contract.currency)],
                  ["Cobrado", money(paid, contract.currency)],
                  ["Por cobrar", contract.amount === null ? "—" : money(Math.max(0, contract.amount - paid), contract.currency)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">{k}</div>
                    <div className="text-[14px] font-bold text-[var(--bp-ink)]">{v}</div>
                  </div>
                ))}
              </div>
              {contract.contractedHours !== null && contract.contractedHours > 0 && (
                <div>
                  <div className="flex justify-between text-[11px] text-[var(--bp-ink-soft)]">
                    <span>Horas ejecutadas frente a contratadas</span>
                    <span className="tabular-nums">
                      {Math.round(row.hours)} / {contract.contractedHours} h
                    </span>
                  </div>
                  <Bar pct={(row.hours / contract.contractedHours) * 100} color={row.hours > contract.contractedHours ? "var(--bp-danger)" : "var(--bp-blue)"} label="Horas ejecutadas frente a contratadas" />
                  {row.hours === 0 && <p className="mt-1 text-[11px] text-[var(--bp-ink-soft)]">Todavía no hay horas registradas en Jira ni capturadas a mano.</p>}
                </div>
              )}
              {Object.keys(contract.stageWeeks).length > 0 && (
                <p className="text-[11px] text-[var(--bp-ink-soft)]">
                  Semanas vendidas: {STAGE_ORDER.filter((s) => contract.stageWeeks[s] !== undefined).map((s) => `${STAGES.find((x) => x.id === s)!.name} ${contract.stageWeeks[s]}`).join(" · ")}
                </p>
              )}
              {contract.payments.length > 0 && (
                <ul className="flex flex-col gap-1 border-t border-[var(--bp-border)] pt-2">
                  {contract.payments.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--bp-ink)]">
                      <span className="font-medium">{p.label}</span>
                      <span className="tabular-nums">{money(p.amount, contract.currency)}</span>
                      <span className="text-[var(--bp-ink-soft)]">{p.dueDate ? `vence ${shortDate(p.dueDate)}` : "sin fecha"}</span>
                      <Badge color={p.paid ? "success" : p.invoiced ? "info" : "neutral"} dot={false}>
                        {p.paid ? "Cobrado" : p.invoiced ? "Facturado" : "Por facturar"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Card>

        <Card title="Avance del sprint">
          {boards.filter((b) => b.sprint).length === 0 ? (
            <Empty>No hay sprint en curso en Jira para este proyecto.</Empty>
          ) : (
            <ul className="flex flex-col gap-3">
              {boards
                .filter((b) => b.sprint)
                .map((b) => (
                  <li key={b.key}>
                    <div className="flex justify-between text-[12px]">
                      <span className="font-semibold text-[var(--bp-ink)]">
                        {b.key} · {b.sprint!.name}
                      </span>
                      <span className="tabular-nums text-[var(--bp-ink-soft)]">
                        {b.sprint!.donePct}% / {b.sprint!.expectedPct}% esperado
                      </span>
                    </div>
                    <div className="mt-1">
                      <Bar pct={b.sprint!.donePct} color={b.sprint!.pace === "al_dia" ? "var(--bp-green)" : b.sprint!.pace === "atrasado" ? "#b8860b" : "var(--bp-danger)"} label={`Avance del sprint de ${b.key}`} />
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card title="Horas por persona">
          {Object.keys(hours.strategistProject).filter((id) => hours.strategistProject[id][row.id]).length === 0 ? (
            <Empty>Sin horas registradas en este proyecto.</Empty>
          ) : (
            <ul className="flex flex-col gap-1 text-[12px] text-[var(--bp-ink)]">
              {Object.entries(hours.strategistProject)
                .filter(([, byProject]) => byProject[row.id])
                .sort(([, a], [, b]) => b[row.id] - a[row.id])
                .map(([id, byProject]) => (
                  <li key={id} className="flex justify-between">
                    <span>{NAME_BY_ID.get(id) ?? id}</span>
                    <span className="tabular-nums text-[var(--bp-ink-soft)]">
                      {Math.round(byProject[row.id])} h{data.allocations[id] ? ` · plan ${data.allocations[id]} h/sem` : ""}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </Card>

        <Card title="Entregable de Comercial">
          {handoffPct === null ? (
            <Empty>Aún no se evalúa lo que entregó Comercial para este proyecto.</Empty>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Bar pct={handoffPct} color={handoffPct >= 80 ? "var(--bp-green)" : handoffPct >= 50 ? "#b8860b" : "var(--bp-danger)"} label="Calidad del entregable de Comercial" />
                <span className="shrink-0 text-[12px] font-bold tabular-nums text-[var(--bp-ink)]">{handoffPct}%</span>
              </div>
              <ul className="mt-2 flex flex-col gap-0.5 text-[11px] text-[var(--bp-ink)]">
                {HANDOFF_ITEMS.map((i) => {
                  const m = data.handoff.items[i.id];
                  return (
                    <li key={i.id} className="flex justify-between gap-2">
                      <span>{i.label}</span>
                      <span className={m === "completo" ? "text-[var(--bp-green)]" : m === "faltante" ? "text-[var(--bp-danger)]" : "text-[var(--bp-ink-soft)]"}>{m ? HANDOFF_MARK_LABELS[m] : "Sin evaluar"}</span>
                    </li>
                  );
                })}
              </ul>
              {data.handoff.notes && <p className="mt-2 text-[11px] text-[var(--bp-ink-soft)]">{data.handoff.notes}</p>}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

export default ProjectDetail;
