"use client";

import Badge from "@/components/ui/Badge";
import BarList from "@/components/dashboard/BarList";
import InsightPanel from "@/components/dashboard/InsightPanel";
import Skeleton from "@/components/ui/Skeleton";
import StatTile from "@/components/dashboard/StatTile";
import StrategistAvatar from "@/components/dashboard/StrategistAvatar";
import { useDashboardFilters } from "@/lib/dashboardFilters";
import { useEffectiveRecords } from "@/lib/strategistRecords";
import { daysSince } from "@/lib/strategists";

const AT_RISK_THRESHOLD = 75;
const OVERDUE_DAYS = 10;
const NO_DATA_LABEL = "Sin información disponible";

function toneFor(score: number): "good" | "warning" | "danger" {
  if (score >= 90) return "good";
  if (score >= AT_RISK_THRESHOLD) return "warning";
  return "danger";
}

export function BitacorasTab() {
  const { bitacorasSync } = useDashboardFilters();
  const rows = useEffectiveRecords();

  if (!bitacorasSync) {
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

  if (!bitacorasSync.configured) {
    return (
      <div className="rounded-[var(--bp-radius-lg)] border border-dashed border-[var(--bp-border)] bg-[var(--bp-surface)] p-6 text-center">
        <h3 className="text-[13px] font-semibold text-[var(--bp-ink)]">Google Sheets no está configurado</h3>
        <p className="mx-auto mt-1 max-w-md text-[12px] leading-relaxed text-[var(--bp-ink-soft)]">
          Agrega <code className="rounded bg-[var(--bp-surface-alt)] px-1 py-0.5">GOOGLE_SERVICE_ACCOUNT_EMAIL</code>,{" "}
          <code className="rounded bg-[var(--bp-surface-alt)] px-1 py-0.5">GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY</code> y{" "}
          <code className="rounded bg-[var(--bp-surface-alt)] px-1 py-0.5">GOOGLE_SHEET_ID</code> en un archivo{" "}
          <code className="rounded bg-[var(--bp-surface-alt)] px-1 py-0.5">.env.local</code> y reinicia el servidor para conectar la
          hoja de bitácoras.
        </p>
      </div>
    );
  }

  if (bitacorasSync.error) {
    return (
      <div className="rounded-[var(--bp-radius-lg)] border border-[var(--bp-danger)]/30 bg-[var(--bp-danger)]/5 p-6 text-center">
        <h3 className="text-[13px] font-semibold text-[var(--bp-danger)]">No se pudo conectar con Google Sheets</h3>
        <p className="mx-auto mt-1 max-w-md text-[12px] leading-relaxed text-[var(--bp-ink)]">{bitacorasSync.error}</p>
      </div>
    );
  }

  const withData = rows.filter((x) => x.r.bitacoraComplianceRate !== null).sort((a, b) => b.r.bitacoraComplianceRate! - a.r.bitacoraComplianceRate!);

  const totalExpected = rows.reduce((acc, x) => acc + (x.r.bitacorasExpected ?? 0), 0);
  const totalSubmitted = rows.reduce((acc, x) => acc + (x.r.bitacorasSubmitted ?? 0), 0);
  const teamRate = totalExpected > 0 ? Math.round((totalSubmitted / totalExpected) * 100) : null;
  const behind = withData.filter((x) => x.r.bitacoraComplianceRate! < AT_RISK_THRESHOLD);
  const overdue = rows.filter((x) => x.r.lastBitacoraDate && daysSince(x.r.lastBitacoraDate) > OVERDUE_DAYS);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-3 py-2">
        <Badge color="success">Datos reales · Google Sheets (bitácoras semanales)</Badge>
        <span className="text-[11px] text-[var(--bp-ink-soft)]">
          Última sincronización: {new Date(bitacorasSync.fetchedAt).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}
        </span>
      </div>

      {bitacorasSync.unmatchedNames.length > 0 && (
        <div className="rounded-[var(--bp-radius-md)] border border-dashed border-[var(--bp-border)] bg-[var(--bp-surface)] px-3 py-2 text-[11px] text-[var(--bp-ink-soft)]">
          La hoja tiene filas que no coinciden con ningún estratega registrado: {bitacorasSync.unmatchedNames.join(", ")}.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="Cumplimiento de bitácoras" value={teamRate !== null ? `${teamRate}%` : NO_DATA_LABEL} tone={teamRate !== null ? toneFor(teamRate) : "neutral"} />
        <StatTile label="Bitácoras registradas" value={`${totalSubmitted} / ${totalExpected}`} sublabel="En el periodo seleccionado" />
        <StatTile
          label="Estrategas atrasados"
          value={String(overdue.length)}
          sublabel={`Sin registrar hace más de ${OVERDUE_DAYS} días`}
          tone={overdue.length > 0 ? "danger" : "good"}
        />
      </div>

      <div className="rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
        <h3 className="text-[13px] font-semibold text-[var(--bp-ink)]">Ranking por cumplimiento de bitácoras</h3>
        <p className="mt-0.5 text-[11px] text-[var(--bp-ink-soft)]">% de bitácoras registradas contra las esperadas en el periodo.</p>
        <div className="mt-3">
          {withData.length === 0 ? (
            <p className="text-[12px] text-[var(--bp-ink-soft)]">{NO_DATA_LABEL} para este periodo.</p>
          ) : (
            <BarList items={withData.map((x) => ({ label: x.s.name, value: x.r.bitacoraComplianceRate!, tone: toneFor(x.r.bitacoraComplianceRate!) }))} />
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-[var(--bp-radius-md)] border border-[var(--bp-border)]">
        <table className="w-full min-w-[600px] border-collapse text-left text-[12px]">
          <thead>
            <tr className="border-b border-[var(--bp-border)] bg-[var(--bp-surface-alt)] text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
              <th className="px-3 py-2">Estratega</th>
              <th className="px-3 py-2 text-right">Registradas</th>
              <th className="px-3 py-2 text-right">Cumplimiento</th>
              <th className="px-3 py-2">Última bitácora</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-[12px] text-[var(--bp-ink-soft)]">
                  Aún no hay estrategas para este filtro.
                </td>
              </tr>
            )}
            {rows.map(({ s, r }, i) => {
              const notApplicable = bitacorasSync.notApplicableIds.includes(s.id);
              const isOverdue = !notApplicable && r.lastBitacoraDate && daysSince(r.lastBitacoraDate) > OVERDUE_DAYS;
              return (
                <tr key={s.id} className="bp-row-in border-b border-[var(--bp-border)] last:border-0" style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}>
                  <td className="px-3 py-2.5">
                    <StrategistAvatar strategist={s} />
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    {notApplicable ? "—" : r.bitacorasExpected !== null ? `${r.bitacorasSubmitted ?? 0} / ${r.bitacorasExpected}` : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    {notApplicable ? (
                      <>
                        100% <span className="text-[11px] text-[var(--bp-ink-soft)]">· No aplica</span>
                      </>
                    ) : r.bitacoraComplianceRate !== null ? (
                      `${r.bitacoraComplianceRate}%`
                    ) : (
                      <span className="text-[11px] text-[var(--bp-ink-soft)]">{NO_DATA_LABEL}</span>
                    )}
                  </td>
                  <td className={`px-3 py-2.5 font-mono ${isOverdue ? "text-[var(--bp-danger)]" : "text-[var(--bp-ink-soft)]"}`}>
                    {notApplicable ? "No aplica por el momento" : r.lastBitacoraDate ?? "—"}
                    {isOverdue && r.lastBitacoraDate ? ` (hace ${daysSince(r.lastBitacoraDate)} días)` : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <InsightPanel
        alerts={[
          ...overdue.map((x) => ({
            text: `${x.s.name} no registra bitácora desde hace ${daysSince(x.r.lastBitacoraDate!)} días.`,
          })),
          ...behind
            .filter((x) => !overdue.some((o) => o.s.id === x.s.id))
            .map((x) => ({ text: `${x.s.name} tiene ${x.r.bitacoraComplianceRate}% de cumplimiento de bitácoras — por debajo de ${AT_RISK_THRESHOLD}%.` })),
        ]}
      />
    </div>
  );
}

export default BitacorasTab;
