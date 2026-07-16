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
    <ul className="flex flex-col gap-2">
      {actionables.map((a) => (
        <li
          key={a.title}
          className="flex items-start gap-3 rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-4 py-3"
        >
          <span
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] ${
              a.done
                ? "border-[var(--bp-success)] bg-[var(--bp-success)] text-white"
                : "border-[var(--bp-border)] text-transparent"
            }`}
          >
            ✓
          </span>
          <div className="flex-1">
            <div className={`text-sm font-medium ${a.done ? "text-[var(--bp-ink-soft)] line-through" : "text-[var(--bp-ink)]"}`}>
              {a.title}
            </div>
            <div className="mt-0.5 text-xs text-[var(--bp-ink-soft)]">
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
