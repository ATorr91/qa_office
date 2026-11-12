"use client";

import { useEffect, useState } from "react";
import StatTile from "@/components/dashboard/StatTile";
import Badge, { type BadgeColor } from "@/components/ui/Badge";
import { useDashboardFilters } from "@/lib/dashboardFilters";
import type { SprintBoardResult, SprintPace, SprintSnapshot } from "@/lib/jiraSprintTypes";
import { STRATEGISTS } from "@/lib/strategists";
import { useSprintProgress } from "@/lib/useSprintProgress";

const NAME_BY_ID = new Map(STRATEGISTS.map((s) => [s.id, s.name]));

const PACE: Record<SprintPace, { label: string; color: BadgeColor; bar: string }> = {
  al_dia: { label: "Al día", color: "success", bar: "var(--bp-green)" },
  atrasado: { label: "Atrasado", color: "warning", bar: "#b8860b" },
  en_riesgo: { label: "En riesgo", color: "danger", bar: "var(--bp-danger)" },
  sin_trabajo: { label: "Sin tickets", color: "neutral", bar: "var(--bp-ink-soft)" },
};

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
function shortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}${y !== new Date().getFullYear() ? ` ${y}` : ""}`;
}

function useNow(everyMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(timer);
  }, [everyMs]);
  return now;
}

function agoLabel(fromIso: string, now: number): string {
  const s = Math.max(0, Math.round((now - Date.parse(fromIso)) / 1000));
  if (s < 10) return "ahora mismo";
  if (s < 60) return `hace ${s} s`;
  return `hace ${Math.floor(s / 60)} min`;
}

function Bar({ done, inProgress, total, color, expectedPct, label }: { done: number; inProgress: number; total: number; color: string; expectedPct?: number; label: string }) {
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);
  return (
    <div role="img" aria-label={label} className="relative h-2.5 w-full rounded-full bg-[var(--bp-surface-alt)]">
      <div className="bp-bar absolute inset-y-0 left-0 overflow-hidden rounded-full" style={{ width: `${pct(done + inProgress)}%` }}>
        <div className="h-full w-full opacity-25" style={{ background: color }} />
      </div>
      <div className="bp-bar absolute inset-y-0 left-0 rounded-full transition-[width] duration-500" style={{ width: `${pct(done)}%`, background: color }} />
      {expectedPct !== undefined && (
        <span
          aria-hidden
          className="absolute -top-1 h-[18px] w-0.5 rounded-full bg-[var(--bp-ink)]"
          style={{ left: `calc(${expectedPct}% - 1px)` }}
          data-tip={`Avance esperado hoy: ${expectedPct}%`}
        />
      )}
    </div>
  );
}

function gapText(s: SprintSnapshot): string {
  if (s.pace === "sin_trabajo") return "El sprint todavía no tiene tickets.";
  if (s.gapPct === 0) return "Justo al ritmo del calendario.";
  return s.gapPct > 0 ? `Va ${s.gapPct} pts adelante del calendario.` : `Va ${Math.abs(s.gapPct)} pts atrás del calendario.`;
}

function SprintCard({ board, sprint }: { board: SprintBoardResult; sprint: SprintSnapshot }) {
  const pace = PACE[sprint.pace];
  const names = board.projects.map((p) => p.name).join(" · ");
  const owners = board.owners.map((id) => NAME_BY_ID.get(id) ?? id);
  return (
    <article className="bp-row-in flex flex-col gap-3 rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold text-[var(--bp-ink)]">
            {names} <span className="ml-1 rounded bg-[var(--bp-surface-alt)] px-1.5 py-0.5 font-mono text-[10px] font-medium text-[var(--bp-ink-soft)]">{board.key}</span>
          </h3>
          <p className="mt-0.5 text-[11px] text-[var(--bp-ink-soft)]">{owners.length > 0 ? owners.join(", ") : "Sin estratega asignado"}</p>
        </div>
        <Badge color={pace.color}>{pace.label}</Badge>
      </header>

      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-[12px] font-semibold text-[var(--bp-ink)]">{sprint.name}</span>
          <span className="text-[11px] text-[var(--bp-ink-soft)]">
            {shortDate(sprint.startDate)} → {shortDate(sprint.endDate)} · {sprint.workingDaysLeft === 1 ? "queda 1 día hábil" : `quedan ${sprint.workingDaysLeft} días hábiles`}
          </span>
        </div>
        <div className="mt-2 flex items-end justify-between gap-3">
          <span className="text-3xl font-bold leading-none" style={{ color: pace.bar }}>
            {sprint.donePct}%
          </span>
          <span className="text-right text-[11px] text-[var(--bp-ink-soft)]">
            Esperado hoy: <span className="font-semibold text-[var(--bp-ink)]">{sprint.expectedPct}%</span>
          </span>
        </div>
        <div className="mt-2">
          <Bar done={sprint.done} inProgress={sprint.inProgress} total={sprint.total} color={pace.bar} expectedPct={sprint.expectedPct} label={`${sprint.done} de ${sprint.total} tickets terminados; esperado hoy ${sprint.expectedPct}%`} />
        </div>
        <p className="mt-2 text-[11px] text-[var(--bp-ink-soft)]">
          {gapText(sprint)} <span className="font-mono">{sprint.done}</span> terminados · <span className="font-mono">{sprint.inProgress}</span> en curso · <span className="font-mono">{sprint.todo}</span> por hacer · <span className="font-mono">{sprint.total}</span> en el sprint
        </p>
      </div>

      {sprint.epics.length > 0 && (
        <div className="border-t border-[var(--bp-border)] pt-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">Por épica, solo lo que está en este sprint</div>
          <ul className="mt-2 flex flex-col gap-2">
            {sprint.epics.map((e) => (
              <li key={e.key ?? "none"} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
                <span className="truncate text-[12px] text-[var(--bp-ink)]" data-tip={e.name}>
                  {e.key && <span className="mr-1.5 font-mono text-[10px] text-[var(--bp-ink-soft)]">{e.key}</span>}
                  {e.name}
                </span>
                <span className="font-mono text-[11px] text-[var(--bp-ink-soft)]">
                  {e.done}/{e.total} · {Math.round((e.done / e.total) * 100)}%
                </span>
                <div className="col-span-2">
                  <Bar done={e.done} inProgress={e.inProgress} total={e.total} color="var(--bp-blue)" label={`${e.name}: ${e.done} de ${e.total} terminados`} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--bp-border)] pt-3 text-[11px] text-[var(--bp-ink-soft)]">
        <span>
          {board.projects.map((p) => `${p.code}: ${shortDate(p.startDate)} → ${shortDate(p.endDate)} (${p.elapsedPct}% del tiempo, ${p.daysLeft} días restantes)`).join(" · ")}
        </span>
        {board.boardUrl && (
          <a href={board.boardUrl} target="_blank" rel="noreferrer" className="font-semibold text-[var(--bp-blue)] hover:underline">
            Abrir tablero <span aria-hidden>↗</span>
          </a>
        )}
      </footer>
    </article>
  );
}

export function SprintProgressTab() {
  const { data, failed, load } = useSprintProgress();
  const { filteredStrategists } = useDashboardFilters();
  const now = useNow(5_000);
  const [refreshing, setRefreshing] = useState(false);

  async function refreshNow() {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }

  const shown = new Set(filteredStrategists.map((s) => s.id));
  const visible = (data?.boards ?? []).filter((b) => b.owners.length === 0 || b.owners.some((id) => shown.has(id)));
  const withSprint = visible.filter((b): b is SprintBoardResult & { sprint: SprintSnapshot } => b.sprint !== null);
  const without = visible.filter((b) => b.sprint === null);
  const onPace = withSprint.filter((b) => b.sprint.pace === "al_dia").length;
  const behind = withSprint.filter((b) => b.sprint.pace === "atrasado" || b.sprint.pace === "en_riesgo").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--bp-ink-soft)]">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className={`h-2 w-2 rounded-full ${failed ? "bg-[var(--bp-danger)]" : data ? "animate-pulse bg-[var(--bp-green)]" : "bg-[var(--bp-ink-soft)]"}`} />
          {data
            ? `En vivo · última lectura de Jira ${agoLabel(data.fetchedAt, now)}. Se actualiza solo cada minuto.`
            : failed
              ? "No se pudo conectar con el servidor de la aplicación."
              : "Leyendo Jira…"}
        </span>
        <button
          type="button"
          onClick={refreshNow}
          disabled={refreshing}
          className="bp-tap rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] px-2.5 py-1 font-semibold text-[var(--bp-ink)] transition-colors hover:border-[var(--bp-blue)] disabled:opacity-60"
        >
          {refreshing ? "Actualizando…" : "Actualizar ahora"}
        </button>
      </div>

      {failed && data && (
        <p role="alert" className="rounded-[var(--bp-radius-md)] border border-[var(--bp-danger)]/30 bg-[var(--bp-danger)]/5 px-3 py-2 text-[12px] text-[var(--bp-danger)]">
          No se pudo actualizar: se muestra la última lectura exitosa. Se reintenta en un minuto.
        </p>
      )}
      {data && !data.configured && (
        <p className="rounded-[var(--bp-radius-md)] border border-dashed border-[var(--bp-border)] px-3 py-4 text-center text-[12px] text-[var(--bp-ink-soft)]">
          Jira no está conectado: faltan JIRA_BASE_URL, JIRA_EMAIL y JIRA_API_TOKEN en las variables de entorno.
        </p>
      )}
      {data?.error && (
        <p role="alert" className="rounded-[var(--bp-radius-md)] border border-[var(--bp-danger)]/30 bg-[var(--bp-danger)]/5 px-3 py-2 text-[12px] text-[var(--bp-danger)]">
          {data.error}
        </p>
      )}

      {data?.configured && !data.error && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatTile label="Proyectos con sprint en curso" value={String(withSprint.length)} sublabel={`${without.length} sin sprint activo`} />
            <StatTile label="Al día" value={String(onPace)} tone="good" sublabel="Avance igual o a menos de 10 pts del calendario" />
            <StatTile label="Atrasados o en riesgo" value={String(behind)} tone={behind > 0 ? "danger" : "good"} sublabel="Más de 10 pts por debajo del calendario" />
          </div>

          {withSprint.length === 0 ? (
            <p className="rounded-[var(--bp-radius-lg)] border border-dashed border-[var(--bp-border)] bg-[var(--bp-surface)] p-6 text-center text-[12px] text-[var(--bp-ink-soft)]">
              Ningún proyecto de este filtro tiene un sprint en curso hoy.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {withSprint.map((b) => (
                <SprintCard key={b.key} board={b} sprint={b.sprint} />
              ))}
            </div>
          )}

          {without.length > 0 && (
            <details className="rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-4 py-3">
              <summary className="cursor-pointer text-[12px] font-semibold text-[var(--bp-ink)]">Proyectos sin sprint en curso ({without.length})</summary>
              <ul className="mt-3 flex flex-col gap-2">
                {without.map((b) => (
                  <li key={b.key} className="text-[12px] text-[var(--bp-ink-soft)]">
                    <span className="font-semibold text-[var(--bp-ink)]">{b.projects.map((p) => p.name).join(" · ")}</span> <span className="font-mono text-[10px]">{b.key}</span> — {b.note}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </div>
  );
}

export default SprintProgressTab;
