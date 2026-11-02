"use client";

import Badge, { type BadgeColor } from "@/components/ui/Badge";
import type { CommentTone, ImportantComment } from "@/lib/npsComments";
import { STRATEGISTS } from "@/lib/strategists";

const TONE_BADGE: Record<CommentTone, BadgeColor> = { positivo: "success", mixto: "warning", constructivo: "danger", "sin calificar": "neutral" };
const nameOf = (id: string) => STRATEGISTS.find((s) => s.id === id)?.name ?? id;

/** Client comments worth reading, each saying who they are directed at. */
export function ImportantComments({ comments, empty, loading = false, failed = false }: { comments: ImportantComment[]; empty: string; loading?: boolean; failed?: boolean }) {
  if (loading) return <p className="text-[12px] text-[var(--bp-ink-soft)]">Cargando los comentarios…</p>;
  if (failed) return <p className="text-[12px] font-medium text-[var(--bp-danger)]">No se pudieron cargar los comentarios del cliente. Recarga la página.</p>;
  if (comments.length === 0) return <p className="text-[12px] text-[var(--bp-ink-soft)]">{empty}</p>;
  return (
    <ul className="flex flex-col gap-2.5">
      {comments.map((c) => (
        <li key={c.key} className="rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[var(--bp-ink-soft)]">
            <Badge color={TONE_BADGE[c.tone]}>{c.tone}</Badge>
            {c.scoreLabel && <span className="font-mono font-semibold text-[var(--bp-ink)]">{c.scoreLabel}</span>}
            <span className="font-medium text-[var(--bp-ink)]">{c.account}</span>
            <span className="font-mono">{c.surveyDate}</span>
            {c.section === "empresa" && <Badge color="neutral">Proceso comercial / administrativo</Badge>}
            <span>
              · {c.mentionedIds.length > 0 ? "Menciona a" : "Para el equipo de la cuenta:"}{" "}
              <strong className="text-[var(--bp-ink)]">{(c.mentionedIds.length > 0 ? c.mentionedIds : c.ownerIds).map(nameOf).join(", ")}</strong>
            </span>
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--bp-ink)]">«{c.text}»</p>
        </li>
      ))}
    </ul>
  );
}

export default ImportantComments;
