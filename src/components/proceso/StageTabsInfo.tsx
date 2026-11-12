"use client";

import Link from "next/link";
import { useState } from "react";
import { useSopLinks } from "@/lib/useSopLinks";
import { sopKey } from "@/lib/projectProcessTypes";
import type { ProcessStage } from "@/lib/procesoTypes";

function External({ href, children, tip }: { href: string; children: React.ReactNode; tip: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" data-tip={tip} className="bp-link-chip inline-flex items-center gap-1 rounded-full bg-[var(--bp-blue-tint)] px-2.5 py-1 text-[11.5px] font-semibold leading-none text-[var(--bp-blue-600)]">
      {children}
      <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden>
        <path d="M6 3h7v7M13 3L6.5 9.5M11 9v4H3V5h4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  );
}

export function SopsPanel({ stage }: { stage: ProcessStage }) {
  const links = useSopLinks();
  return (
    <ul className="grid gap-3 xl:grid-cols-2">
      {stage.sops.map((sop) => {
        const team = links[sopKey(stage.id, sop.title)];
        return (
          <li key={sop.title} className="rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] px-4 py-3">
            <p className="text-[13px] font-semibold leading-snug text-[var(--bp-ink)]">{sop.title}</p>
            <p className="text-[11px] text-[var(--bp-ink-soft)]">{sop.owner}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {team && <External href={team} tip="Documento del equipo, se abre en otra pestaña">Abrir SOP</External>}
              {sop.url && <External href={sop.url} tip={`Referencia pública: ${new URL(sop.url).hostname}`}>Referencia</External>}
              {!team && !sop.url && (
                <Link href="/dashboard-estrategas/admin#sops" className="text-[11px] text-[var(--bp-ink-soft)] underline-offset-2 hover:text-[var(--bp-blue-600)] hover:underline">
                  Sin enlace: agregar
                </Link>
              )}
            </div>
            <details className="group mt-2">
              <summary className="flex w-fit cursor-pointer list-none items-center gap-1 text-[12px] font-semibold text-[var(--bp-ink)] hover:text-[var(--bp-blue-600)] [&::-webkit-details-marker]:hidden">
                <svg viewBox="0 0 16 16" className="h-3 w-3 transition-transform duration-[var(--bp-dur)] group-open:rotate-90" aria-hidden>
                  <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {sop.steps.length} pasos
              </summary>
              <ol className="mt-1.5 list-decimal pl-5 text-[12px] leading-snug text-[var(--bp-ink)]">
                {sop.steps.map((s) => (
                  <li key={s} className="mb-1">
                    {s}
                  </li>
                ))}
              </ol>
            </details>
          </li>
        );
      })}
    </ul>
  );
}

function SkillRow({ name, use }: { name: string; use: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(name);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked: the name is still on screen to copy by hand.
    }
  }
  return (
    <li className="rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] px-4 py-2.5">
      <button type="button" onClick={copy} data-tip="Copiar el nombre de la skill" className="bp-tap max-w-full break-words rounded-[var(--bp-radius-sm)] text-left font-mono text-[11.5px] font-semibold text-[var(--bp-blue-600)] hover:underline">
        {copied ? <span key="c" className="bp-anim-pop inline-block">Copiado ✓</span> : name}
      </button>
      <p className="mt-0.5 text-[12px] leading-snug text-[var(--bp-ink-soft)]">{use}</p>
    </li>
  );
}

export function SkillsPanel({ stage }: { stage: ProcessStage }) {
  return (
    <ul className="grid gap-3 xl:grid-cols-2">
      {stage.skills.map((s) => (
        <SkillRow key={s.name} name={s.name} use={s.use} />
      ))}
    </ul>
  );
}
