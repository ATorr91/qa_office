"use client";

import Badge from "@/components/ui/Badge";
import BarList from "@/components/dashboard/BarList";
import InsightPanel from "@/components/dashboard/InsightPanel";
import Skeleton from "@/components/ui/Skeleton";
import StatTile from "@/components/dashboard/StatTile";
import StrategistAvatar from "@/components/dashboard/StrategistAvatar";
import TrendSparkline from "@/components/dashboard/TrendSparkline";
import { useDashboardFilters, type DeadlinesByEmail as ByEmail, type MonthDeadlineCount } from "@/lib/dashboardFilters";
import { useStrategistRecords } from "@/lib/strategistRecords";
import { getMonthShortLabel, getPreviousMonth, monthsForPeriod, periodYear, monthsInYear, type MonthKey } from "@/lib/strategists";

const AT_RISK_THRESHOLD = 70;

function toneFor(score: number): "good" | "warning" | "danger" {
  if (score >= 90) return "good";
  if (score >= AT_RISK_THRESHOLD) return "warning";
  return "danger";
}

function rate(onTime: number, assigned: number): number {
  return assigned > 0 ? Math.round((onTime / assigned) * 100) : 0;
}

function pct(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

function sumMonths(byEmail: ByEmail, email: string, months: MonthKey[]): MonthDeadlineCount {
  const rec = byEmail[email];
  if (!rec) return { assigned: 0, onTime: 0 };
  return months.reduce(
    (acc, m) => ({ assigned: acc.assigned + (rec[m]?.assigned ?? 0), onTime: acc.onTime + (rec[m]?.onTime ?? 0) }),
    { assigned: 0, onTime: 0 },
  );
}

export function DeadlinesTab() {
  const { filteredStrategists, period, jiraDeadlines: data } = useDashboardFilters();
  const { jiraBoards } = useStrategistRecords();

  if (!data) {
    return (
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Skeleton className="h-[72px]" />
          <Skeleton className="h-[72px]" />
          <Skeleton className="h-[72px]" />
        </div>
        <Skeleton className="h-56" />
      </div>
    );
  }

  if (!data.configured) {
    return (
      <div className="rounded-[var(--bp-radius-lg)] border border-dashed border-[var(--bp-border)] bg-[var(--bp-surface)] p-6 text-center">
        <h3 className="text-[13px] font-semibold text-[var(--bp-ink)]">Jira no está configurado</h3>
        <p className="mx-auto mt-1 max-w-md text-[12px] leading-relaxed text-[var(--bp-ink-soft)]">
          Agrega <code className="rounded bg-[var(--bp-surface-alt)] px-1 py-0.5">JIRA_BASE_URL</code>,{" "}
          <code className="rounded bg-[var(--bp-surface-alt)] px-1 py-0.5">JIRA_EMAIL</code> y{" "}
          <code className="rounded bg-[var(--bp-surface-alt)] px-1 py-0.5">JIRA_API_TOKEN</code> en un archivo{" "}
          <code className="rounded bg-[var(--bp-surface-alt)] px-1 py-0.5">.env.local</code> en la raíz del proyecto, reinicia el
          servidor, y conecta el tablero de cada estratega desde Admin.
        </p>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="rounded-[var(--bp-radius-lg)] border border-[var(--bp-danger)]/30 bg-[var(--bp-danger)]/5 p-6 text-center">
        <h3 className="text-[13px] font-semibold text-[var(--bp-danger)]">No se pudo conectar con Jira</h3>
        <p className="mx-auto mt-1 max-w-md text-[12px] leading-relaxed text-[var(--bp-ink)]">{data.error}</p>
      </div>
    );
  }

  const monthsForCurrentPeriod = monthsForPeriod(period);

  if (monthsForCurrentPeriod.length === 0) {
    return (
      <div className="rounded-[var(--bp-radius-lg)] border border-dashed border-[var(--bp-border)] bg-[var(--bp-surface)] p-6 text-center text-[12px] text-[var(--bp-ink-soft)]">
        No existe información para este periodo — el tracking empezó en julio 2026.
      </div>
    );
  }

  const rows = filteredStrategists
    .map((s) => {
      const c = sumMonths(data.byEmail, s.email, monthsForCurrentPeriod);
      const boardConfigured = !data.unconfiguredEmails?.includes(s.email);
      return {
        s,
        assigned: c.assigned,
        onTime: c.onTime,
        complianceRate: rate(c.onTime, c.assigned),
        boardConfigured,
        statusCount: data.issueStatusByEmail[s.email],
      };
    })
    .sort((a, b) => b.complianceRate - a.complianceRate);

  const totalAssigned = rows.reduce((acc, x) => acc + x.assigned, 0);
  const totalOnTime = rows.reduce((acc, x) => acc + x.onTime, 0);
  const teamRate = rate(totalOnTime, totalAssigned);
  const atRisk = rows.filter((x) => x.assigned > 0 && x.complianceRate < AT_RISK_THRESHOLD);
  const withoutBoard = rows.filter((x) => !x.boardConfigured);

  const trendMonths = monthsInYear(periodYear(period));
  const teamTrend = trendMonths.map((m) => {
    let assigned = 0;
    let onTime = 0;
    for (const s of filteredStrategists) {
      const c = sumMonths(data.byEmail, s.email, [m]);
      assigned += c.assigned;
      onTime += c.onTime;
    }
    return { label: getMonthShortLabel(m), value: rate(onTime, assigned) };
  });

  const deltaComments = filteredStrategists
    .map((s) => {
      if (monthsForCurrentPeriod.length === 0) return null;
      const currMonth = monthsForCurrentPeriod[monthsForCurrentPeriod.length - 1];
      const prevMonth = getPreviousMonth(currMonth);
      if (!prevMonth) return null;
      const prev = sumMonths(data.byEmail, s.email, [prevMonth]);
      const curr = sumMonths(data.byEmail, s.email, [currMonth]);
      if (prev.assigned === 0 || curr.assigned === 0) return null;
      const prevRate = rate(prev.onTime, prev.assigned);
      const currRate = rate(curr.onTime, curr.assigned);
      const delta = currRate - prevRate;
      if (Math.abs(delta) < 8) return null;
      return {
        author: s.name,
        text:
          delta > 0
            ? `Su cumplimiento de deadlines subió ${delta} pts vs. el mes anterior.`
            : `Su cumplimiento de deadlines bajó ${Math.abs(delta)} pts vs. el mes anterior.`,
        delta,
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-3 py-2">
        <Badge color="success">Datos reales · Jira (tablero por estratega)</Badge>
        <span className="text-[11px] text-[var(--bp-ink-soft)]">
          Última sincronización: {new Date(data.fetchedAt).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}
        </span>
      </div>

      {withoutBoard.length > 0 && Object.keys(jiraBoards).length < filteredStrategists.length && (
        <div className="rounded-[var(--bp-radius-md)] border border-dashed border-[var(--bp-border)] bg-[var(--bp-surface)] px-3 py-2 text-[11px] text-[var(--bp-ink-soft)]">
          {withoutBoard.length} estratega{withoutBoard.length === 1 ? "" : "s"} sin tablero de Jira conectado todavía — configúralo en Admin.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="Cumplimiento de deadlines" value={`${teamRate}%`} tone={toneFor(teamRate)} />
        <StatTile label="Deadlines a tiempo" value={`${totalOnTime} / ${totalAssigned}`} sublabel="En el periodo seleccionado" />
        <StatTile
          label="Estrategas por debajo del umbral"
          value={String(atRisk.length)}
          sublabel={`Cumplimiento < ${AT_RISK_THRESHOLD}%`}
          tone={atRisk.length > 0 ? "danger" : "good"}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
          <h3 className="text-[13px] font-semibold text-[var(--bp-ink)]">Tendencia de cumplimiento</h3>
          <p className="mt-0.5 text-[11px] text-[var(--bp-ink-soft)]">Cumplimiento del equipo por mes, para el año seleccionado.</p>
          <div className="mt-3">
            <TrendSparkline points={teamTrend} color="var(--bp-cyan)" />
          </div>
        </div>
        <div className="rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
          <h3 className="text-[13px] font-semibold text-[var(--bp-ink)]">Ranking por cumplimiento</h3>
          <p className="mt-0.5 text-[11px] text-[var(--bp-ink-soft)]">% de deadlines entregados a tiempo en el periodo.</p>
          <div className="mt-3">
            <BarList items={rows.map((x) => ({ label: x.s.name, value: x.complianceRate, tone: toneFor(x.complianceRate) }))} />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[var(--bp-radius-md)] border border-[var(--bp-border)]">
        <table className="w-full min-w-[860px] border-collapse text-left text-[12px]">
          <thead>
            <tr className="border-b border-[var(--bp-border)] bg-[var(--bp-surface-alt)] text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
              <th className="px-3 py-2">Estratega</th>
              <th className="px-3 py-2 text-right">A tiempo</th>
              <th className="px-3 py-2 text-right">Asignados</th>
              <th className="px-3 py-2 text-right">Cumplimiento</th>
              <th className="px-3 py-2 text-right">Total incidencias</th>
              <th className="px-3 py-2 text-right">En curso / revisión</th>
              <th className="px-3 py-2 text-right">Por hacer</th>
              <th className="px-3 py-2 text-right">% Finalizadas</th>
            </tr>
          </thead>
          <tbody>
            {rows.every((r) => r.assigned === 0 && (!r.statusCount || r.statusCount.total === 0)) ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-[12px] text-[var(--bp-ink-soft)]">
                  Aún no hay incidencias en los tableros de Jira conectados para este periodo.
                </td>
              </tr>
            ) : (
              rows.map(({ s, assigned, onTime, complianceRate, boardConfigured, statusCount }, i) => (
                <tr key={s.id} className="bp-row-in border-b border-[var(--bp-border)] last:border-0" style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}>
                  <td className="px-3 py-2.5">
                    <StrategistAvatar strategist={s} />
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">{onTime}</td>
                  <td className="px-3 py-2.5 text-right font-mono">{assigned}</td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    {!boardConfigured ? (
                      <span className="text-[11px] text-[var(--bp-ink-soft)]">Sin tablero</span>
                    ) : assigned > 0 ? (
                      `${complianceRate}%`
                    ) : (
                      "—"
                    )}
                  </td>
                  {!boardConfigured ? (
                    <td colSpan={4} className="px-3 py-2.5 text-right text-[11px] text-[var(--bp-ink-soft)]">
                      Sin tablero
                    </td>
                  ) : !statusCount || statusCount.total === 0 ? (
                    <td colSpan={4} className="px-3 py-2.5 text-right text-[11px] text-[var(--bp-ink-soft)]">
                      Sin incidencias registradas
                    </td>
                  ) : (
                    <>
                      <td className="px-3 py-2.5 text-right font-mono">{statusCount.total}</td>
                      <td className="px-3 py-2.5 text-right font-mono">
                        {statusCount.inProgress} <span className="text-[11px] text-[var(--bp-ink-soft)]">({pct(statusCount.inProgress, statusCount.total)}%)</span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono">
                        {statusCount.todo} <span className="text-[11px] text-[var(--bp-ink-soft)]">({pct(statusCount.todo, statusCount.total)}%)</span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="font-mono text-[15px] font-bold text-[var(--bp-green)]">{pct(statusCount.done, statusCount.total)}%</span>
                        <span className="ml-1 text-[11px] text-[var(--bp-ink-soft)]">({statusCount.done}/{statusCount.total})</span>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <InsightPanel
        alerts={atRisk.map((x) => ({ text: `${x.s.name} cumplió solo ${x.complianceRate}% de sus deadlines (${x.onTime}/${x.assigned}) según Jira.` }))}
        comments={deltaComments}
      />
    </div>
  );
}

export default DeadlinesTab;
