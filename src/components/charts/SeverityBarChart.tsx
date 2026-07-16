import type { BugsBySeverity } from "@/lib/projects";

const ROWS: { key: keyof BugsBySeverity; label: string; color: string }[] = [
  { key: "critical", label: "Crítico", color: "var(--bp-danger)" },
  { key: "high", label: "Alto", color: "var(--bp-purple)" },
  { key: "medium", label: "Medio", color: "var(--bp-warning)" },
  { key: "low", label: "Bajo", color: "var(--bp-success)" },
];

export function SeverityBarChart({ data }: { data: BugsBySeverity }) {
  const max = Math.max(1, data.critical, data.high, data.medium, data.low);

  return (
    <div className="flex flex-col gap-3">
      {ROWS.map((row) => {
        const value = data[row.key];
        return (
          <div key={row.key} className="flex items-center gap-3">
            <div className="w-14 shrink-0 text-xs font-medium text-[var(--bp-ink-soft)]">{row.label}</div>
            <div className="h-2.5 flex-1 rounded-[var(--bp-radius-pill)] bg-[var(--bp-surface-alt)]">
              <div
                className="h-full rounded-[var(--bp-radius-pill)] transition-all duration-[var(--bp-dur)]"
                style={{ width: `${(value / max) * 100}%`, backgroundColor: row.color }}
              />
            </div>
            <div className="w-6 shrink-0 text-right text-sm font-semibold text-[var(--bp-ink)]">{value}</div>
          </div>
        );
      })}
    </div>
  );
}

export default SeverityBarChart;
