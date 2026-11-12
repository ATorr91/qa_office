"use client";

import Link from "next/link";
import { STAGE_STYLE } from "@/components/proceso/procesoUi";
import { stageHref } from "@/components/site/siteNav";
import { ioItemId, ioOf } from "@/lib/procesoIo";
import { STAGES } from "@/lib/procesoStages";
import type { ProcessStage, StageFile, StageId } from "@/lib/procesoTypes";

const STAGE_NAME = Object.fromEntries(STAGES.map((s) => [s.id, s.name])) as Record<StageId, string>;

function Arrow({ direction }: { direction: "in" | "out" }) {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
      <path d="M3 10.5V13h10v-2.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d={direction === "in" ? "M8 2.5v7M5.2 6.8L8 9.5l2.8-2.7" : "M8 9.5v-7M5.2 5.2L8 2.5l2.8 2.7"} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FileRow({ file, id, checked, onToggle, side, color }: { file: StageFile; id: string; checked: boolean; onToggle: () => void; side: "in" | "out"; color: string }) {
  const verb = side === "in" ? "Recibido" : "Entregado";
  return (
    <li>
      <label htmlFor={id} className="group/file flex cursor-pointer items-start gap-3 rounded-[var(--bp-radius-sm)] px-2 py-2 transition-colors duration-[var(--bp-dur-fast)] hover:bg-[var(--bp-surface-alt)]">
        <input id={id} type="checkbox" checked={checked} onChange={onToggle} className="bp-check mt-[3px] h-3.5 w-3.5 shrink-0 accent-[var(--bp-blue)]" aria-label={`${verb}: ${file.name}`} />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={`text-[13px] font-semibold leading-snug transition-colors duration-[var(--bp-dur-fast)] ${checked ? "text-[var(--bp-ink-soft)] line-through" : "text-[var(--bp-ink)]"}`}>{file.name}</span>
            <span className="rounded-[var(--bp-radius-sm)] bg-[var(--bp-surface-alt)] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[var(--bp-ink)] ring-1 ring-inset ring-[var(--bp-border)]">{file.format}</span>
          </span>
          {!file.from && <span className="mt-0.5 block text-[12px] leading-snug text-[var(--bp-ink-soft)]">{file.where}</span>}
          {file.note && <span className="mt-0.5 block text-[12px] leading-snug text-[var(--bp-ink)]">{file.note}</span>}
          {(file.from || (file.usedIn && file.usedIn.length > 0)) && (
            <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {file.from && (
                <Link
                  href={stageHref(file.from)}
                  onClick={(e) => e.stopPropagation()}
                  data-tip={`Sale de ${STAGE_NAME[file.from]}. Ir a la etapa`}
                  className="bp-link-chip inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold leading-4 text-[var(--bp-ink)]"
                  style={{ backgroundColor: `color-mix(in srgb, ${STAGE_STYLE[file.from].color} 22%, white)` }}
                >
                  Viene de {STAGE_NAME[file.from]}
                </Link>
              )}
              {file.usedIn?.map((to) => (
                <Link
                  key={to}
                  href={stageHref(to)}
                  onClick={(e) => e.stopPropagation()}
                  data-tip={`Lo usa ${STAGE_NAME[to]}. Ir a la etapa`}
                  className="bp-link-chip inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold leading-4 text-[var(--bp-ink)]"
                  style={{ backgroundColor: `color-mix(in srgb, ${STAGE_STYLE[to].color} 22%, white)` }}
                >
                  Lo usa {STAGE_NAME[to]}
                </Link>
              ))}
            </span>
          )}
        </span>
        <span aria-hidden className="mt-0.5 hidden h-2 w-2 shrink-0 rounded-full opacity-0 transition-opacity duration-[var(--bp-dur)] sm:block" style={{ backgroundColor: color, opacity: checked ? 1 : undefined }} />
      </label>
    </li>
  );
}

/** What the stage needs before it can start and what it has to leave delivered. Ticks are practice marks, kept in this browser. */
export function StageFiles({ stage, done, toggle }: { stage: ProcessStage; done: Record<string, boolean>; toggle: (id: string) => void }) {
  const { inputs, outputs } = ioOf(stage);
  const { color } = STAGE_STYLE[stage.id];
  const received = inputs.filter((_, i) => done[ioItemId(stage.id, "in", i)]).length;
  const delivered = outputs.filter((_, i) => done[ioItemId(stage.id, "out", i)]).length;
  const titleId = `${stage.id}-files-title`;

  const column = (side: "in" | "out", files: StageFile[], count: number) => (
    <div className="min-w-0">
      <div className="flex items-center gap-2 border-b border-[var(--bp-border)] px-4 py-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--bp-ink)]" style={{ backgroundColor: `color-mix(in srgb, ${color} 26%, white)` }}>
          <Arrow direction={side} />
        </span>
        <h4 className="text-[13px] font-bold text-[var(--bp-ink)]">{side === "in" ? "Entradas" : "Salidas"}</h4>
        <span className="ml-auto text-[12px] font-semibold tabular-nums text-[var(--bp-ink)]" aria-label={`${count} de ${files.length} ${side === "in" ? "recibidos" : "entregados"}`}>
          {count}/{files.length}
        </span>
      </div>
      <ul className="bp-stagger flex flex-col px-2 py-2">
        {files.map((f, i) => {
          const id = ioItemId(stage.id, side, i);
          return <FileRow key={id} id={`${stage.id}-${side}-${i}`} file={f} checked={!!done[id]} onToggle={() => toggle(id)} side={side} color={color} />;
        })}
      </ul>
    </div>
  );

  return (
    <section aria-labelledby={titleId} className="rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] bg-[var(--bp-surface)]">
      <h3 id={titleId} className="sr-only">
        Archivos de la etapa
      </h3>
      <div className="grid lg:grid-cols-2 lg:divide-x lg:divide-[var(--bp-border)]">
        {column("in", inputs, received)}
        <div className="border-t border-[var(--bp-border)] lg:border-t-0">{column("out", outputs, delivered)}</div>
      </div>
    </section>
  );
}

export default StageFiles;
