import Link from "next/link";
import KnowledgePanel from "@/components/trends/KnowledgePanel";

export default function ConocimientoPage() {
  return (
    <div className="bp-anim-page flex flex-col gap-5">
      <div>
        <Link
          href="/estrategas"
          className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--bp-ink-soft)] hover:text-[var(--bp-blue)]"
        >
          <svg viewBox="0 0 16 16" className="h-3 w-3">
            <path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Trend Hunting
        </Link>
        <h1 className="mt-1.5 text-2xl font-bold text-[var(--bp-ink)]">Base de conocimiento</h1>
        <p className="mt-1 max-w-2xl text-[13px] text-[var(--bp-ink-soft)]">
          Sube PDFs, links, imágenes u otros documentos. Este mismo conocimiento se comparte con el radar del equipo y con la búsqueda de tendencias.
        </p>
      </div>

      <KnowledgePanel />
    </div>
  );
}
