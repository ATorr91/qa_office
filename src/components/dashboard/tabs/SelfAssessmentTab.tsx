"use client";

import BarList from "@/components/dashboard/BarList";
import StrategistAvatar from "@/components/dashboard/StrategistAvatar";
import { useDashboardFilters } from "@/lib/dashboardFilters";
import { useEffectiveRecords } from "@/lib/strategistRecords";
import { getMonthLabel, getPeriodLabel } from "@/lib/strategists";

const NO_DATA_LABEL = "Sin información disponible";

function SelfAssessmentBlock({
  monthLabel,
  assessment,
  showLabel,
}: {
  monthLabel: string;
  assessment: { biggestWin: string; mistakeLearning: string; skillToDevelop: string };
  showLabel: boolean;
}) {
  return (
    <div className="border-t border-[var(--bp-border)] pt-3 first:border-0 first:pt-0">
      {showLabel && (
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">{monthLabel}</div>
      )}
      <dl className="flex flex-col gap-2 text-[12px] leading-relaxed">
        <div>
          <dt className="font-semibold text-[var(--bp-green)]">Mayor victoria</dt>
          <dd className="text-[var(--bp-ink)]">{assessment.biggestWin || "—"}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[#b8860b]">Peor error / aprendizaje</dt>
          <dd className="text-[var(--bp-ink)]">{assessment.mistakeLearning || "—"}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[var(--bp-blue-600)]">Habilidad a desarrollar</dt>
          <dd className="text-[var(--bp-ink)]">{assessment.skillToDevelop || "—"}</dd>
        </div>
      </dl>
    </div>
  );
}

export function SelfAssessmentTab() {
  const { period } = useDashboardFilters();
  const rows = useEffectiveRecords().filter((x) => x.r.selfAssessments.length > 0);

  const totalEntries = rows.reduce((acc, x) => acc + x.r.selfAssessments.length, 0);

  const skillCounts = new Map<string, number>();
  for (const x of rows) {
    for (const a of x.r.selfAssessments) {
      if (!a.skillToDevelop) continue;
      skillCounts.set(a.skillToDevelop, (skillCounts.get(a.skillToDevelop) ?? 0) + 1);
    }
  }
  const topSkills = [...skillCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value]) => ({
      label: label.length > 64 ? `${label.slice(0, 61)}…` : label,
      value,
      displayValue: String(value),
    }));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">Autoevaluaciones registradas</div>
          <div className="mt-1 text-2xl font-bold text-[var(--bp-blue)]">{totalEntries}</div>
          <div className="mt-0.5 text-[12px] text-[var(--bp-ink-soft)]">
            {rows.length} estratega{rows.length === 1 ? "" : "s"} con datos · {getPeriodLabel(period)}
          </div>
        </div>
        <div className="rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
          <h3 className="text-[13px] font-semibold text-[var(--bp-ink)]">Habilidades más mencionadas</h3>
          <p className="mt-0.5 text-[11px] text-[var(--bp-ink-soft)]">Habilidad técnica a desarrollar, agregada del periodo seleccionado.</p>
          <div className="mt-3">
            {topSkills.length === 0 ? (
              <p className="text-[12px] text-[var(--bp-ink-soft)]">{NO_DATA_LABEL}.</p>
            ) : (
              <BarList items={topSkills} maxValue={Math.max(1, rows.length)} />
            )}
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-[var(--bp-radius-lg)] border border-dashed border-[var(--bp-border)] bg-[var(--bp-surface)] p-6 text-center text-[12px] text-[var(--bp-ink-soft)]">
          {NO_DATA_LABEL} para este periodo.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {rows.map(({ s, r }, i) => (
            <div
              key={s.id}
              className="bp-row-in flex flex-col gap-3 rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4"
              style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}
            >
              <StrategistAvatar strategist={s} />
              <div className="flex flex-col gap-3">
                {r.selfAssessments.map((a) => (
                  <SelfAssessmentBlock
                    key={a.month}
                    monthLabel={getMonthLabel(a.month)}
                    assessment={a}
                    showLabel={r.selfAssessments.length > 1}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SelfAssessmentTab;
