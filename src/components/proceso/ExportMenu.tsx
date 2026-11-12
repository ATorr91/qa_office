"use client";

import { useRef, useState } from "react";
import { copyText, downloadText } from "@/lib/procesoExport";

export interface PdfJob {
  /** Becomes the file name the browser proposes when saving the PDF. */
  title: string;
  markdown: string;
}

const btn = "bp-tap px-2.5 py-1.5 text-[12px] font-semibold text-[var(--bp-ink)] transition-colors duration-[var(--bp-dur-fast)] hover:bg-[var(--bp-blue-tint)] hover:text-[var(--bp-blue-600)]";

/**
 * Three ways to take a piece of the process with you: copy it as Markdown, save the .md file, or save a PDF. The Markdown is the
 * useful one for Claude (paste it into a chat or add the file to a project); the PDF is the same text laid out for reading.
 */
export function ExportMenu({ subject, filename, getMarkdown, onPdf }: { subject: string; filename: string; getMarkdown: () => string; onPdf: (job: PdfJob) => void }) {
  const [copied, setCopied] = useState<"ok" | "fail" | null>(null);
  const timer = useRef(0);

  async function copy() {
    const ok = await copyText(getMarkdown());
    setCopied(ok ? "ok" : "fail");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div role="group" aria-label={`Llevarte ${subject}`} className="inline-flex shrink-0 divide-x divide-[var(--bp-border)] overflow-hidden rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] bg-[var(--bp-surface)]">
      <button type="button" onClick={copy} className={btn} data-tip={`Copia ${subject} en Markdown para pegarlo en una conversación de Claude`}>
        {copied === "ok" ? <span key="ok" className="bp-anim-pop inline-block">Copiado ✓</span> : copied === "fail" ? "No se pudo copiar" : "Copiar"}
      </button>
      <button type="button" onClick={() => downloadText(`${filename}.md`, getMarkdown())} className={btn} data-tip={`Descarga ${subject} como archivo .md para subirlo a un proyecto de Claude`}>
        .md
      </button>
      <button type="button" onClick={() => onPdf({ title: filename, markdown: getMarkdown() })} className={btn} data-tip={`Abre la ventana de impresión: elige «Guardar como PDF» para llevarte ${subject}`}>
        PDF
      </button>
    </div>
  );
}

export default ExportMenu;
