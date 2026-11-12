export interface BarListItem {
  label: string;
  value: number;
  displayValue?: string;
  tone?: "good" | "warning" | "danger";
}

const TONE_COLORS: Record<string, string> = {
  good: "var(--bp-green)",
  warning: "#b8860b",
  danger: "var(--bp-danger)",
};

export function BarList({ items, maxValue = 100 }: { items: BarListItem[]; maxValue?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => {
        const pct = Math.max(0, Math.min(100, (item.value / maxValue) * 100));
        const color = item.tone ? TONE_COLORS[item.tone] : "var(--bp-blue)";
        return (
          <div key={item.label} className="bp-row-in" style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}>
            <div className="mb-1 flex items-center justify-between text-[12px]">
              <span className="text-[var(--bp-ink)]">{item.label}</span>
              <span className="font-mono text-[var(--bp-ink-soft)]">{item.displayValue ?? `${Math.round(item.value)}%`}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bp-surface-alt)]">
              <div
                className="bp-bar h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default BarList;
