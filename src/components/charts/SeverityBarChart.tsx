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
    <div className="flex flex-col gap-2">
      {ROWS.map((row) => {
        const value = data[row.key];
        return (
          <div key={row.key} className="flex items-center gap-2.5">
            <div className="w-12 shrink-0 text-[11px] font-medium text-[var(--bp-ink-soft)]">{row.label}</div>
            <div className="h-2 flex-1 rounded-[var(--bp-radius-pill)] bg-[var(--bp-surface-alt)]">
              <div
                className="h-full rounded-[var(--bp-radius-pill)] transition-all duration-[var(--bp-dur)]"
                style={{ width: `${(value / max) * 100}%`, backgroundColor: row.color }}
              />
            </div>
            <div className="w-5 shrink-0 text-right font-mono text-[13px] font-semibold text-[var(--bp-ink)]">
              {value}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default SeverityBarChart;
