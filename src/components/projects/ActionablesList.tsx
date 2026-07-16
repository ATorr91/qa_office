import Badge from "@/components/ui/Badge";
import type { Actionable, Priority } from "@/lib/projects";

const PRIORITY_COLOR: Record<Priority, "danger" | "warning" | "neutral"> = {
  Alta: "danger",
  Media: "warning",
  Baja: "neutral",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}

export function ActionablesList({ actionables }: { actionables: Actionable[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {actionables.map((a) => (
        <li
          key={a.title}
          className="flex items-start gap-2.5 rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-3 py-2"
        >
          <span
            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 text-[9px] ${
              a.done
                ? "border-[var(--bp-success)] bg-[var(--bp-success)] text-white"
                : "border-[var(--bp-border)] text-transparent"
            }`}
          >
            ✓
          </span>
          <div className="flex-1">
            <div className={`text-[13px] font-medium ${a.done ? "text-[var(--bp-ink-soft)] line-through" : "text-[var(--bp-ink)]"}`}>
              {a.title}
            </div>
            <div className="mt-0.5 font-mono text-[11px] text-[var(--bp-ink-soft)]">
              {a.owner} · vence {formatDate(a.due)}
            </div>
          </div>
          <Badge color={PRIORITY_COLOR[a.priority]}>{a.priority}</Badge>
        </li>
      ))}
    </ul>
  );
}

export default ActionablesList;
