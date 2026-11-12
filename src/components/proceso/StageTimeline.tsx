import Link from "next/link";
import { STAGE_STYLE } from "@/components/proceso/procesoUi";
import { stageHref } from "@/components/site/siteNav";
import { STAGES } from "@/lib/procesoStages";
import type { StageId } from "@/lib/procesoTypes";

/** The five stages as one connected line. Every node is a link, so the timeline is how the stage sites join up. */
export function StageTimeline({ current }: { current: StageId }) {
  const at = STAGES.findIndex((s) => s.id === current);
  return (
    <nav aria-label="Etapas del proceso">
      <ol className="flex items-start">
        {STAGES.map((s, i) => {
          const { color, on } = STAGE_STYLE[s.id];
          const isCurrent = i === at;
          return (
            <li key={s.id} className="relative flex min-w-0 flex-1 flex-col items-center">
              {i > 0 && <span aria-hidden className="absolute right-1/2 top-[15px] h-0.5 w-full -translate-y-1/2 transition-colors duration-[var(--bp-dur)]" style={{ backgroundColor: i <= at ? color : "var(--bp-border)" }} />}
              <Link href={stageHref(s.id)} aria-current={isCurrent ? "step" : undefined} data-tip={s.goal} className="group/node relative z-10 flex flex-col items-center gap-1.5 px-1 text-center">
                <span
                  className="flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 bg-[var(--bp-surface)] text-[13px] font-bold text-[var(--bp-ink)] transition-all duration-[var(--bp-dur)] group-hover/node:scale-110"
                  style={isCurrent ? { backgroundColor: color, borderColor: color, color: on } : { borderColor: color }}
                >
                  {s.number}
                </span>
                <span className={`truncate text-[12px] transition-colors duration-[var(--bp-dur-fast)] ${isCurrent ? "font-bold text-[var(--bp-ink)]" : "font-medium text-[var(--bp-ink-soft)] group-hover/node:text-[var(--bp-ink)]"}`}>{s.name}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default StageTimeline;
