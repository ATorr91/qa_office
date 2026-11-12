import { PILLARS } from "@/lib/procesoStages";

const panel = "rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] bg-[var(--bp-surface)] shadow-[var(--bp-shadow-sm)]";

export function PillarsSection() {
  return (
    <section id="resumen" aria-labelledby="pillars-title" className="bp-reveal scroll-mt-24">
      <h2 id="pillars-title" className="text-xl font-bold text-[var(--bp-ink)]">
        Tres pilares en las cinco etapas
      </h2>
      <div className={`${panel} bp-stagger mt-3 grid divide-y divide-[var(--bp-border)] lg:grid-cols-3 lg:divide-x lg:divide-y-0`}>
        {PILLARS.map((p) => (
          <div key={p.name} className="p-4">
            <h3 className="text-[14px] font-bold text-[var(--bp-ink)]">{p.name}</h3>
            <p className="mt-0.5 max-w-[60ch] text-[12px] leading-snug text-[var(--bp-ink-soft)]">{p.idea}</p>
            <ul className="mt-2 flex list-disc flex-col gap-1 pl-4 text-[12px] leading-snug text-[var(--bp-ink)]">
              {p.practices.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
