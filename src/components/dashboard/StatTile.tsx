import CountUp from "@/components/ui/CountUp";

export type StatTone = "good" | "warning" | "danger" | "neutral";

const TONE_COLORS: Record<StatTone, string> = {
  good: "var(--bp-green)",
  warning: "#b8860b",
  danger: "var(--bp-danger)",
  neutral: "var(--bp-blue)",
};

export function StatTile({
  label,
  value,
  sublabel,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sublabel?: string;
  tone?: StatTone;
}) {
  return (
    <div className="bp-row-in flex flex-col gap-1 rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
      <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">{label}</div>
      <div className="text-2xl font-bold" style={{ color: TONE_COLORS[tone] }}>
        <CountUp key={value} value={value} />
      </div>
      {sublabel && <div className="text-[12px] text-[var(--bp-ink-soft)]">{sublabel}</div>}
    </div>
  );
}

export default StatTile;
