"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Tooltip from "@/components/ui/Tooltip";
import SignalDetailModal from "./SignalDetailModal";
import SignalsTable from "./SignalsTable";
import { MEDIA_TYPE_LABELS, MEDIA_TYPE_OPTIONS, type Signal, type SignalMediaType, type SignalOrigin } from "@/lib/signals";
import { fetchSignals, type SignalsQueryMode } from "@/lib/signalsProvider";
import { useKnowledge } from "@/lib/knowledgeStore";
import { useSearchHistory } from "@/lib/searchHistory";
import { effectiveHeat, useSignalFeedback } from "@/lib/signalFeedback";
import { smartSearch } from "@/lib/search";

const ORIGIN_OPTIONS: { value: SignalOrigin | "all"; label: string }[] = [
  { value: "all", label: "Todo" },
  { value: "mercado", label: "Mercado" },
  { value: "competencia", label: "Competencia" },
];

/** Curation date for the current SIGNALS dataset — update when re-researching. */
const DATASET_CURATED_AT = "2026-08-06";

function formatSearchedAt(iso: string) {
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TrendSearchPanel({ category }: { category: string }) {
  const { docs } = useKnowledge();
  const { history, addQuery, clearHistory } = useSearchHistory("buscar");
  const { feedback, dismissed, setFeedback, dismiss } = useSignalFeedback();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SignalsQueryMode>("search");
  const [origin, setOrigin] = useState<SignalOrigin | "all">("all");
  const [mediaType, setMediaType] = useState<SignalMediaType | "all">("all");
  const [rawResults, setRawResults] = useState<Signal[]>([]);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [resultsError, setResultsError] = useState<string | null>(null);
  const [searchedAt, setSearchedAt] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Signal | null>(null);
  const requestIdRef = useRef(0);

  const runFetch = useCallback(() => {
    const requestId = ++requestIdRef.current;
    setResultsLoading(true);
    fetchSignals({ query, origin, mode })
      .then((signals) => {
        if (requestIdRef.current !== requestId) return; // a newer request superseded this one
        setRawResults(signals);
        setResultsError(null);
        if (mode === "featured") setSearchedAt(new Date().toISOString());
      })
      .catch(() => {
        if (requestIdRef.current !== requestId) return;
        setResultsError("No se pudieron obtener señales en este momento.");
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setResultsLoading(false);
      });
  }, [query, origin, mode]);

  useEffect(() => {
    const timeout = window.setTimeout(runFetch, 300);
    return () => window.clearTimeout(timeout);
  }, [runFetch]);

  const results = useMemo(() => {
    const withCategory = category === "all" ? rawResults : rawResults.filter((s) => s.category === category);
    const withMediaType = mediaType === "all" ? withCategory : withCategory.filter((s) => s.mediaType === mediaType);
    return withMediaType
      .filter((s) => !dismissed.includes(s.id))
      .sort((a, b) => effectiveHeat(b.heat, feedback[b.id]) - effectiveHeat(a.heat, feedback[a.id]));
  }, [rawResults, category, mediaType, dismissed, feedback]);

  const knowledgeMatches = useMemo(() => {
    if (query.trim() === "" || docs.length === 0) return [];
    return smartSearch(docs, query, (d) => [
      { text: d.name, weight: 2 },
      { text: d.text, weight: 1 },
    ]).slice(0, 3);
  }, [query, docs]);

  function commitQuery() {
    if (query.trim() !== "") addQuery(query);
  }

  function handleNewSearch() {
    setQuery("");
    setOrigin("all");
    setMediaType("all");
    setMode("search");
    setSearchedAt(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Tooltip text="Busca en un set de señales curadas manualmente por el equipo: cada fuente fue investigada y verificada como real antes de añadirse. No es una búsqueda en vivo del internet abierto — todavía. Escribe una idea completa: la búsqueda entiende frases, no solo palabras sueltas." />
          <span
            title={`Fuentes verificadas manualmente · última actualización del set: ${DATASET_CURATED_AT}`}
            className="flex items-center gap-1.5 text-[11px] text-[var(--bp-ink-soft)]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--bp-blue)]" />
            Fuentes verificadas · act. {DATASET_CURATED_AT}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setMode("search");
            }}
            onKeyDown={(e) => e.key === "Enter" && commitQuery()}
            onBlur={commitQuery}
            placeholder="Describe lo que buscas, p. ej. '¿qué está pasando con onboarding asistido por IA en banca?'…"
            className="w-full rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-3 py-1.5 pr-8 text-[13px] text-[var(--bp-ink)] outline-none placeholder:text-[var(--bp-ink-soft)] focus:border-[var(--bp-blue)]"
          />
          {resultsLoading && (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[var(--bp-blue)]"
            >
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          )}
        </div>
        <Button kind={mode === "featured" ? "primary" : "outline"} size="sm" onClick={() => { setQuery(""); setMode("featured"); }}>
          Ver señales destacadas
        </Button>
        <button
          type="button"
          title="Refrescar resultados"
          onClick={runFetch}
          disabled={resultsLoading}
          className="bp-tap flex h-7 w-7 items-center justify-center rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] text-[var(--bp-ink-soft)] transition-transform duration-[var(--bp-dur-fast)] hover:scale-110 hover:border-[var(--bp-blue)] hover:text-[var(--bp-blue)] disabled:opacity-40"
        >
          <svg
            viewBox="0 0 16 16"
            className={`h-3.5 w-3.5 ${resultsLoading ? "animate-spin" : ""}`}
            fill="none"
          >
            <path
              d="M13.5 8A5.5 5.5 0 1 1 11.9 4.1M13.5 2v3.5H10"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <Button kind="ghost" size="sm" onClick={handleNewSearch}>
          + Nueva búsqueda
        </Button>
        <span className="text-[12px] text-[var(--bp-ink-soft)] sm:ml-auto">
          {resultsLoading ? "Buscando…" : `${results.length} señal${results.length === 1 ? "" : "es"}`}
        </span>
      </div>

      {resultsError && <p className="text-[12px] text-[var(--bp-danger)]">{resultsError}</p>}

      {mode === "featured" && searchedAt && (
        <div className="text-[11px] text-[var(--bp-ink-soft)]">
          Consultado el <span className="font-mono text-[var(--bp-ink)]">{formatSearchedAt(searchedAt)}</span> · ordenado por relevancia curada, no por fecha de publicación
        </div>
      )}

      {history.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">Recientes:</span>
          {history.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => {
                setQuery(h);
                setMode("search");
              }}
              className="rounded-[var(--bp-radius-pill)] border border-[var(--bp-border)] px-2.5 py-1 text-[11px] text-[var(--bp-ink-soft)] hover:border-[var(--bp-blue)] hover:text-[var(--bp-blue-600)]"
            >
              {h}
            </button>
          ))}
          <button type="button" onClick={clearHistory} className="text-[11px] text-[var(--bp-ink-soft)] underline-offset-2 hover:underline">
            Limpiar historial
          </button>
        </div>
      )}

      <div className="flex items-center gap-1">
        <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">Fuente:</span>
        {ORIGIN_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setOrigin(o.value)}
            className={`bp-tap rounded-[var(--bp-radius-pill)] border px-2.5 py-1 text-[11px] font-medium transition-colors duration-[var(--bp-dur)] ${
              origin === o.value
                ? "border-[var(--bp-blue)] bg-[var(--bp-blue)]/10 text-[var(--bp-blue-600)]"
                : "border-[var(--bp-border)] text-[var(--bp-ink-soft)] hover:border-[var(--bp-blue)]"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">Tipo de contenido:</span>
        <select
          value={mediaType}
          onChange={(e) => setMediaType(e.target.value as SignalMediaType | "all")}
          className="rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-2.5 py-1 text-[12px] text-[var(--bp-ink)] outline-none focus:border-[var(--bp-blue)]"
        >
          <option value="all">Todos</option>
          {MEDIA_TYPE_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {MEDIA_TYPE_LABELS[m]}
            </option>
          ))}
        </select>
        <span className="text-[11px] text-[var(--bp-ink-soft)]">
          incluye eventos, congresos, charlas y workshops
        </span>
      </div>

      {knowledgeMatches.length > 0 && (
        <div className="flex flex-col gap-1.5 rounded-[var(--bp-radius-md)] border border-dashed border-[var(--bp-blue)]/40 bg-[var(--bp-blue)]/5 p-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-blue-600)]">
            Coincidencias en tu base de conocimiento
          </span>
          {knowledgeMatches.map((d) => (
            <div key={d.id} className="text-[12px] text-[var(--bp-ink)]">
              <span className="font-semibold">{d.name}</span>{" "}
              <span className="text-[var(--bp-ink-soft)]">— {d.text.slice(0, 140).trim()}…</span>
            </div>
          ))}
        </div>
      )}

      <SignalsTable
        signals={results}
        feedback={feedback}
        onFeedback={setFeedback}
        onDismiss={dismiss}
        onViewDetails={(s) => setViewing(s)}
        loading={resultsLoading}
      />

      {viewing && <SignalDetailModal signal={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

export default TrendSearchPanel;
