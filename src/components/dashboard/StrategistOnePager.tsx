"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import EmptyPeriodHint from "@/components/dashboard/EmptyPeriodHint";
import ManualDeadlinesNotice from "@/components/dashboard/ManualDeadlinesNotice";
import ImportantComments from "@/components/dashboard/ImportantComments";
import StrategistAvatar from "@/components/dashboard/StrategistAvatar";
import TrendSparkline from "@/components/dashboard/TrendSparkline";
import { scoreColor } from "@/components/dashboard/admin/ScoreBreakdown";
import Badge from "@/components/ui/Badge";
import { ACCOUNTS } from "@/lib/accounts";
import { PROJECT_CATALOG } from "@/lib/projectCatalog";
import { useDashboardFilters } from "@/lib/dashboardFilters";
import {
  getEffectiveRecordForMonth,
  performanceComponents,
  useEffectiveRecordFor,
  useStrategistRecords,
} from "@/lib/strategistRecords";
import { importantComments } from "@/lib/npsComments";
import { getMonthShortLabel, isBeforeTrackingStart, PROJECT_STATUS_LABELS, STRATEGISTS, type ProjectStatus, getPeriodLabel, monthsForPeriod, monthsInYear, OKR_STATUS_LABELS, periodYear, type OkrStatus } from "@/lib/strategists";

const NO_DATA = "Sin información disponible";
const CARD = "rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4 print:break-inside-avoid print:p-3";
const PROJECT_BADGE: Record<ProjectStatus, "success" | "info" | "warning" | "neutral"> = { active: "success", planned: "info", paused: "warning", completed: "neutral", inactive: "neutral" };
const OKR_BADGE: Record<OkrStatus, "success" | "warning" | "danger"> = { "on-track": "success", "at-risk": "warning", "off-track": "danger" };

function Card({ title, hint, children, className = "" }: { title: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`${CARD} ${className}`}>
      <h2 className="text-[13px] font-semibold text-[var(--bp-ink)]">{title}</h2>
      {hint && <p className="mt-0.5 text-[11px] text-[var(--bp-ink-soft)]">{hint}</p>}
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

function Metric({ label, value, detail, color }: { label: string; value: string; detail: string; color?: string }) {
  return (
    <div className="rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] px-3 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">{label}</div>
      <div className="mt-0.5 text-xl font-bold tabular-nums" style={{ color: color ?? "var(--bp-ink)" }}>
        {value}
      </div>
      <div className="mt-0.5 text-[11px] leading-snug text-[var(--bp-ink-soft)]">{detail}</div>
    </div>
  );
}

const formatDay = (iso: string) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }) : "—");
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Everything the dashboard knows about one strategist, on a single printable page. */
export function StrategistOnePager({ strategistId }: { strategistId: string }) {
  const { period, jiraDeadlines, bitacorasSync, externalScores } = useDashboardFilters();
  const { recordsByStrategist, getProjectHistory, getSources, hydrated } = useStrategistRecords();
  const found = useEffectiveRecordFor(strategistId);

  if (!found) {
    return (
      <div className={CARD}>
        <h1 className="text-[15px] font-semibold text-[var(--bp-ink)]">No encontramos a esa persona</h1>
        <p className="mt-1 text-[12px] text-[var(--bp-ink-soft)]">El perfil que buscas no está en el equipo de estrategas.</p>
      </div>
    );
  }

  const { s, r } = found;
  const components = performanceComponents(r);
  const counted = components.filter((c) => c.value !== null).length;
  const sources = getSources(s.id);
  const projects = getProjectHistory(s.id);
  const jiraStatus = jiraDeadlines?.configured && !jiraDeadlines.error && sources.jira ? jiraDeadlines.issueStatusByEmail[s.email] : undefined;

  const trend = monthsInYear(periodYear(period))
    .map((m) => {
      const score = getEffectiveRecordForMonth(s, m, recordsByStrategist, jiraDeadlines, bitacorasSync, externalScores).performanceScore;
      return score !== null ? { label: getMonthShortLabel(m), value: score } : null;
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  // Accounts this person owns, with what the QA emails and NPS surveys say about each one in the selected period.
  const months = new Set(monthsForPeriod(period));
  const accounts = ACCOUNTS.filter((a) => a.strategists.includes(s.id)).map((a) => {
    const reports = (externalScores?.qaReports ?? []).filter((q) => q.account === a.key && months.has(q.cutDate.slice(0, 7)));
    const rates = reports.map((q) => q.passRate).filter((v): v is number => v !== null);
    const surveys = (externalScores?.npsSurveys ?? []).filter((v) => v.account === a.key && months.has(v.surveyDate.slice(0, 7)));
    return {
      a,
      reportCount: reports.length,
      avgPass: rates.length > 0 ? Math.round((rates.reduce((x, y) => x + y, 0) / rates.length) * 10) / 10 : null,
      lastStatus: reports[0]?.status ?? null,
      surveys,
    };
  });

  const clientComments = importantComments(externalScores?.npsSurveys ?? [], STRATEGISTS, months, new Set([s.id]), 4);

  // Months in which this person's accounts have written client feedback, so an empty period can point to where it is.
  const commentMonths = [
    ...new Set((externalScores?.npsSurveys ?? []).filter((v) => v.strategistIds.includes(s.id) && v.comments.length > 0).map((v) => v.surveyDate.slice(0, 7))),
  ].filter((m) => !isBeforeTrackingStart(m));

  // What Jira says about each of this person's projects: tickets assigned to them and tickets they wrote.
  const jiraByKey = sources.jira && jiraDeadlines?.configured && !jiraDeadlines.error ? jiraDeadlines.projectsByEmail?.[s.email] ?? {} : null;
  const jiraLine = (code: string | undefined, name: string): string => {
    if (jiraByKey === null) return sources.jira ? "Cargando…" : "No usa Jira";
    const keys = PROJECT_CATALOG.find((c) => c.code === code && c.name === name)?.jiraKeys ?? [];
    const own = keys.map((k) => jiraByKey[k]).filter((v) => v !== undefined);
    if (own.length === 0) return keys.length === 0 ? "Sin proyecto en Jira" : "Sin tickets suyos";
    const sum = (f: (v: (typeof own)[number]) => number) => own.reduce((acc, v) => acc + f(v), 0);
    const assigned = sum((v) => v.total);
    const parts = [];
    if (assigned > 0) parts.push(`${assigned} asignados (${sum((v) => v.done)} hechos${sum((v) => v.overdueOpen) > 0 ? `, ${sum((v) => v.overdueOpen)} vencidos` : ""})`);
    if (sum((v) => v.reported) > 0) parts.push(`${sum((v) => v.reported)} creados`);
    return parts.join(" · ") || "Sin tickets suyos";
  };

  const detail: Record<string, string> = {
    peer: r.peerReviewScore === null ? "Sin peer review en el periodo: no cuenta" : plural(r.peerReviewCount ?? 0, "evaluación", "evaluaciones"),
    okr: r.okrs.length > 0 ? plural(r.okrs.length, "objetivo", "objetivos") : "Sin objetivos capturados",
    deadlines: r.deadlinesAssigned > 0 ? `${r.deadlinesOnTime} de ${r.deadlinesAssigned} a tiempo` : sources.jira ? "Sin incidencias con fecha límite" : "Captura manual: no usa Jira",
    bitacoras:
      r.bitacorasExpected !== null ? `${r.bitacorasSubmitted} de ${r.bitacorasExpected} entregadas` : sources.bitacoras ? "Sin semanas por evaluar" : "Captura manual",
    qa: r.qaReportCount > 0 ? plural(r.qaReportCount, "reporte de QA", "reportes de QA") : "Sin reportes en el periodo",
  };
  const satisfaction = r.satisfactionScore !== null ? (1 + (r.satisfactionScore / 100) * 4).toFixed(1) : null;
  const assessment = r.selfAssessments[r.selfAssessments.length - 1];
  const generatedAt = new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="bp-onepager bp-anim-page flex flex-col gap-3">
      <section className={`${CARD} flex flex-wrap items-center justify-between gap-4`}>
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
          <StrategistAvatar strategist={s} size={52} />
          <div className="min-w-0 text-[12px] text-[var(--bp-ink-soft)]">
            <div className="break-all">{s.email}</div>
            <div className="mt-0.5">
              Periodo: <strong className="text-[var(--bp-ink)]">{getPeriodLabel(period)}</strong> · Fuentes: Jira {sources.jira ? "✓" : "manual"} · Bitácoras{" "}
              {sources.bitacoras ? "✓" : "manual"}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="sm:text-right">
            <div className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">Evaluación de desempeño</div>
            <div className="text-4xl font-bold tabular-nums leading-tight" style={{ color: scoreColor(r.performanceScore) }}>
              {r.performanceScore !== null ? `${r.performanceScore}%` : "Sin datos"}
            </div>
            <div className="text-[11px] text-[var(--bp-ink-soft)]">
              {counted} de {components.length} métricas con dato
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="bp-tap rounded-[var(--bp-radius-sm)] bg-[var(--bp-blue)] px-3 py-1.5 text-[12px] font-semibold text-white transition-all duration-[var(--bp-dur)] hover:bg-[var(--bp-blue-600)] active:scale-[0.96] print:hidden"
          >
            Descargar one pager (PDF)
          </button>
        </div>
      </section>

      <Card title="Evaluación de desempeño" hint="Promedio de estas cinco métricas de ejecución. Una métrica sin dato no cuenta.">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {components.map((c) => (
            <Metric
              key={c.key}
              label={c.label}
              value={c.value !== null ? `${c.value}%` : c.key === "peer" ? "NA" : "—"}
              detail={detail[c.key]}
              color={c.value !== null ? scoreColor(c.value) : "var(--bp-ink-soft)"}
            />
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-5 print:grid-cols-5">
        <Card title="Tendencia de desempeño" hint="Promedio por mes del año seleccionado." className="flex flex-col lg:col-span-2 print:col-span-2">
          <div className="min-h-[150px] flex-1">
            {trend.length > 1 ? <TrendSparkline points={trend} /> : <p className="text-[12px] text-[var(--bp-ink-soft)]">{trend.length === 1 ? `${trend[0].label}: ${trend[0].value}%` : NO_DATA}</p>}
          </div>
        </Card>

        <Card title="Percepción del cliente" hint="Se evalúa aparte: no entra al promedio de desempeño." className="lg:col-span-3 print:col-span-3">
          <div className="grid grid-cols-3 gap-2">
            <Metric label="NPS" value={r.npsScore !== null ? String(r.npsScore) : "—"} detail={r.npsResponses > 0 ? plural(r.npsResponses, "encuesta", "encuestas") : "Sin encuestas en el periodo"} />
            <Metric label="CSAT" value={r.csatScore !== null ? `${r.csatScore}%` : "—"} detail={r.csatResponses > 0 ? plural(r.csatResponses, "respuesta", "respuestas") : "Sin respuestas en el periodo"} />
            <Metric label="Satisfacción" value={satisfaction ? `${satisfaction} ⭐` : "—"} detail="Promedio de las respuestas de 1 a 5 de las encuestas" />
          </div>
        </Card>
      </div>

      <Card title="Lo que dice el cliente" hint="Comentarios importantes de las encuestas de sus cuentas en el periodo.">
        <ImportantComments comments={clientComments} empty="Sin comentarios del cliente en este periodo." loading={externalScores === null} failed={!!externalScores?.error} />
        {clientComments.length === 0 && externalScores !== null && !externalScores.error && (
          <div className="mt-3 print:hidden">
            <EmptyPeriodHint monthsWithData={commentMonths} metric="Los comentarios del cliente" />
          </div>
        )}
      </Card>

      <Card title="Proyectos" hint="Los proyectos en los que está asignada esta persona, con su código, célula y fechas.">
        {projects.length === 0 ? (
          <p className="text-[12px] text-[var(--bp-ink-soft)]">{hydrated ? "Sin proyectos asignados." : "Cargando…"}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-[12px]">
              <thead>
                <tr className="border-b border-[var(--bp-border)] text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
                  <th className="py-1.5 pr-3">Proyecto</th>
                  <th className="px-3 py-1.5">Célula</th>
                  <th className="px-3 py-1.5">Estatus</th>
                  <th className="px-3 py-1.5">Inicio</th>
                  <th className="px-3 py-1.5">Fin</th>
                  <th className="pl-3 py-1.5">Jira</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id} className="border-b border-[var(--bp-border)] last:border-0 align-top">
                    <td className="py-1.5 pr-3">
                      <div className="font-medium text-[var(--bp-ink)]">
                        {p.code && <span className="mr-1.5 rounded bg-[var(--bp-surface-alt)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--bp-ink-soft)]">{p.code}</span>}
                        {p.projectName}
                      </div>
                      {p.notes && (
                        <div className="text-[10px] text-[var(--bp-ink-soft)]">
                          {p.notes.startsWith("Provisional") && <span className="mr-1 rounded-full bg-[#b8860b]/15 px-1.5 py-px font-semibold text-[#8a6508]">Por confirmar</span>}
                          {p.notes.replace(/^Provisional · /, "").replace(/ · por confirmar$/, "")}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-[var(--bp-ink-soft)]">{p.cell ?? "—"}</td>
                    <td className="px-3 py-1.5">{p.status ? <Badge color={PROJECT_BADGE[p.status]}>{PROJECT_STATUS_LABELS[p.status]}</Badge> : "—"}</td>
                    <td className="px-3 py-1.5 font-mono text-[11px]">{formatDay(p.startDate)}</td>
                    <td className="px-3 py-1.5 font-mono text-[11px]">{formatDay(p.endDate ?? "")}</td>
                    <td className="pl-3 py-1.5 text-[11px] text-[var(--bp-ink-soft)]">{jiraLine(p.code, p.projectName)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Cuentas" hint="Lo que dicen los reportes de QA y las encuestas de NPS de cada cuenta en el periodo.">
        {accounts.length === 0 ? (
          <p className="text-[12px] text-[var(--bp-ink-soft)]">Esta persona no tiene cuentas asignadas (se editan en src/lib/accounts.ts).</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-left text-[12px]">
              <thead>
                <tr className="border-b border-[var(--bp-border)] text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
                  <th className="py-1.5 pr-3">Cuenta</th>
                  <th className="px-3 py-1.5 text-right">Reportes QA</th>
                  <th className="px-3 py-1.5 text-right">Pass Rate</th>
                  <th className="px-3 py-1.5">Último estatus</th>
                  <th className="pl-3 py-1.5">Encuesta NPS</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(({ a, reportCount, avgPass, lastStatus, surveys }) => (
                  <tr key={a.key} className="border-b border-[var(--bp-border)] last:border-0">
                    <td className="py-1.5 pr-3 font-medium text-[var(--bp-ink)]">{a.name}</td>
                    <td className="px-3 py-1.5 text-right font-mono">{reportCount > 0 ? reportCount : "—"}</td>
                    <td className="px-3 py-1.5 text-right font-mono">{avgPass !== null ? `${avgPass}%` : "—"}</td>
                    <td className="px-3 py-1.5">
                      {lastStatus ? <Badge color={/riesgo/i.test(lastStatus) ? "warning" : /atras/i.test(lastStatus) ? "danger" : "success"}>{lastStatus.toUpperCase()}</Badge> : "—"}
                    </td>
                    <td className="pl-3 py-1.5">
                      {surveys.length === 0
                        ? "—"
                        : surveys.map((v) => (v.answer === null ? "Pendiente" : `${v.answer}/10`)).join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 print:grid-cols-2">
        <Card title="OKRs y KPIs">
          {r.okrs.length === 0 ? (
            <p className="text-[12px] text-[var(--bp-ink-soft)]">{NO_DATA}.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {r.okrs.slice(0, 4).map((okr, i) => (
                <li key={i} className="flex items-start justify-between gap-2 text-[12px]">
                  <span className="min-w-0 text-[var(--bp-ink)]">
                    <span className="font-medium">{okr.objective}</span>
                    {okr.keyResult && <span className="text-[var(--bp-ink-soft)]"> · {okr.keyResult}</span>}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <span className="font-mono">{okr.progress}%</span>
                    <Badge color={OKR_BADGE[okr.status]}>{OKR_STATUS_LABELS[okr.status]}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Ejecución" hint="Deadlines en Jira y bitácoras semanales.">
          <ul className="flex flex-col gap-1.5 text-[12px] text-[var(--bp-ink)]">
            <li>
              <span className="text-[var(--bp-ink-soft)]">Deadlines:</span>{" "}
              {r.deadlineComplianceRate !== null ? `${r.deadlineComplianceRate}% (${detail.deadlines})` : detail.deadlines}
            </li>
            {jiraStatus && (
              <li>
                <span className="text-[var(--bp-ink-soft)]">Incidencias en Jira:</span> {jiraStatus.total} en total · {jiraStatus.done} hechas · {jiraStatus.inProgress} en curso ·{" "}
                {jiraStatus.todo} por hacer
                {jiraStatus.overdueOpen > 0 && <span className="font-medium text-[var(--bp-danger)]"> · {jiraStatus.overdueOpen} vencidas sin cerrar</span>}
                {jiraStatus.noDueDate > 0 && <span className="text-[#8a6508]"> · {jiraStatus.noDueDate} sin fecha límite</span>}
              </li>
            )}
            <li>
              <span className="text-[var(--bp-ink-soft)]">Bitácoras:</span>{" "}
              {r.bitacoraComplianceRate !== null ? `${r.bitacoraComplianceRate}% (${detail.bitacoras})` : detail.bitacoras}
              {r.lastBitacoraDate && <span className="text-[var(--bp-ink-soft)]"> · última {r.lastBitacoraDate}</span>}
            </li>
          </ul>
          {!sources.jira && (
            <div className="mt-3">
              <ManualDeadlinesNotice />
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 print:grid-cols-2">
        <Card title="Peer reviews">
          {r.peerComments.length === 0 ? (
            <p className="text-[12px] text-[var(--bp-ink-soft)]">{r.peerReviewScore === null ? "NA: sin peer review en el periodo." : "Sin comentarios capturados."}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {r.peerComments.slice(0, 3).map((c, i) => (
                <li key={i} className="text-[12px] text-[var(--bp-ink)]">
                  <Badge color={c.sentiment === "positivo" ? "success" : "warning"}>{c.sentiment}</Badge> <span className="text-[var(--bp-ink-soft)]">{c.from}:</span> {c.comment}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Autoevaluación">
          {assessment ? (
            <dl className="flex flex-col gap-1.5 text-[12px]">
              {[
                ["Mayor victoria", assessment.biggestWin],
                ["Aprendizaje", assessment.mistakeLearning],
                ["Habilidad a desarrollar", assessment.skillToDevelop],
              ]
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">{k}</dt>
                    <dd className="text-[var(--bp-ink)]">{v}</dd>
                  </div>
                ))}
            </dl>
          ) : (
            <p className="text-[12px] text-[var(--bp-ink-soft)]">Sin autoevaluación capturada.</p>
          )}
        </Card>
      </div>

      <p className="text-center text-[10px] text-[var(--bp-ink-soft)]">
        BluePixel Studio · One pager de {s.name} · generado el {generatedAt}
        {!hydrated && " · cargando datos…"} ·{" "}
        <Link href="/dashboard-estrategas/documentacion" className="underline print:hidden">
          de dónde sale cada dato
        </Link>
      </p>
    </div>
  );
}

export default StrategistOnePager;
