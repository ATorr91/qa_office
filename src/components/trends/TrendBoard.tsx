"use client";

import { useEffect, useMemo, useState } from "react";
import TrendDetailModal from "./TrendDetailModal";
import TrendFormModal from "./TrendFormModal";
import TrendsPrintableReport from "./TrendsPrintableReport";
import TrendsTable from "./TrendsTable";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { smartSearch } from "@/lib/search";
import { useKnowledge } from "@/lib/knowledgeStore";
import { useSearchHistory } from "@/lib/searchHistory";
import { useTrends } from "@/lib/trendStore";
import { downloadTextFile, trendsToMarkdown } from "@/lib/trendExport";
import {
  RING_LABELS,
  RING_OPTIONS,
  SORT_OPTIONS,
  type Trend,
  type TrendSortKey,
} from "@/lib/trends";

function sortItems(items: Trend[], key: TrendSortKey) {
  return [...items].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (key === "recent") return b.spottedAt.localeCompare(a.spottedAt);
    return b[key] - a[key];
  });
}

export function TrendBoard({ category }: { category: string }) {
  const { trends, updateTrend, removeTrend, togglePin } = useTrends();
  const { docs } = useKnowledge();
  const { history, addQuery, clearHistory } = useSearchHistory("radar");

  const [query, setQuery] = useState("");
  const [ring, setRing] = useState<string>("all");
  const [sort, setSort] = useState<TrendSortKey>("recent");
  const [selected, setSelected] = useState<Trend | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let base = trends;
    if (category !== "all") base = base.filter((t) => t.category === category);
    if (ring !== "all") base = base.filter((t) => t.ring === ring);
    return smartSearch(base, query, (t) => [
      { text: t.title, weight: 3 },
      { text: t.summary, weight: 1 },
      { text: t.category, weight: 2 },
      { text: t.source, weight: 1 },
      { text: t.adopters.join(" "), weight: 1 },
      { text: t.pestle.join(" "), weight: 1 },
    ]);
  }, [trends, query, category, ring]);

  const sorted = useMemo(() => sortItems(filtered, sort), [filtered, sort]);

  const knowledgeMatches = useMemo(() => {
    if (query.trim() === "" || docs.length === 0) return [];
    return smartSearch(docs, query, (d) => [
      { text: d.name, weight: 2 },
      { text: d.text, weight: 1 },
    ]).slice(0, 3);
  }, [query, docs]);

  const editingTrend = editingId ? trends.find((t) => t.id === editingId) : undefined;
  const deletingTrend = deletingId ? trends.find((t) => t.id === deletingId) : undefined;

  useEffect(() => {
    setSelectedIds((prev) => {
      const visibleIds = new Set(sorted.map((t) => t.id));
      const next = new Set([...prev].filter((id) => visibleIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [sorted]);

  const exportList = selectedIds.size > 0 ? sorted.filter((t) => selectedIds.has(t.id)) : sorted;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const allSelected = sorted.length > 0 && sorted.every((t) => prev.has(t.id));
      return allSelected ? new Set() : new Set(sorted.map((t) => t.id));
    });
  }

  function commitQuery() {
    if (query.trim() !== "") addQuery(query);
  }

  function handleNewSearch() {
    setQuery("");
    setRing("all");
  }

  function handleDownloadMarkdown() {
    downloadTextFile("radar-de-tendencias.md", trendsToMarkdown(exportList), "text/markdown");
  }

  function handleDownloadPdf() {
    window.print();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="print:hidden flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && commitQuery()}
          onBlur={commitQuery}
          placeholder="Buscar por tendencia, tema o fuente…"
          className="w-full rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-3 py-1.5 text-[13px] text-[var(--bp-ink)] outline-none placeholder:text-[var(--bp-ink-soft)] focus:border-[var(--bp-blue)] sm:max-w-xs"
        />
        <select
          value={ring}
          onChange={(e) => setRing(e.target.value)}
          className="rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-3 py-1.5 text-[13px] text-[var(--bp-ink)] outline-none focus:border-[var(--bp-blue)]"
        >
          <option value="all">Todos los anillos</option>
          {RING_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {RING_LABELS[r]}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as TrendSortKey)}
          className="rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-3 py-1.5 text-[13px] text-[var(--bp-ink)] outline-none focus:border-[var(--bp-blue)]"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              Ordenar: {o.label}
            </option>
          ))}
        </select>
        <Button kind="ghost" size="sm" onClick={handleNewSearch}>
          + Nueva búsqueda
        </Button>
        <span className="text-[12px] text-[var(--bp-ink-soft)]">
          {sorted.length} tendencia{sorted.length === 1 ? "" : "s"}
        </span>
        <div className="relative sm:ml-auto flex items-center gap-2">
          {selectedIds.size > 0 && (
            <span className="text-[11px] text-[var(--bp-ink-soft)]">
              {selectedIds.size} seleccionada{selectedIds.size === 1 ? "" : "s"}{" "}
              <button type="button" onClick={() => setSelectedIds(new Set())} className="underline-offset-2 hover:underline">
                limpiar
              </button>
            </span>
          )}
          <Button
            kind="outline"
            size="sm"
            onClick={() => setDownloadMenuOpen((v) => !v)}
            onBlur={() => setTimeout(() => setDownloadMenuOpen(false), 150)}
          >
            Descargar {selectedIds.size > 0 ? "selección" : "resultados"} ⌄
          </Button>
          {downloadMenuOpen && (
            <div className="bp-modal-panel absolute right-0 top-full z-10 mt-1 w-44 overflow-hidden rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] shadow-[var(--bp-shadow-md)]">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleDownloadMarkdown();
                }}
                className="block w-full px-3 py-2 text-left text-[12px] text-[var(--bp-ink)] hover:bg-[var(--bp-surface-alt)]"
              >
                Markdown (.md)
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleDownloadPdf();
                }}
                className="block w-full px-3 py-2 text-left text-[12px] text-[var(--bp-ink)] hover:bg-[var(--bp-surface-alt)]"
              >
                PDF (imprimir)
              </button>
            </div>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div className="print:hidden flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
            Recientes:
          </span>
          {history.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setQuery(h)}
              className="rounded-[var(--bp-radius-pill)] border border-[var(--bp-border)] px-2.5 py-1 text-[11px] text-[var(--bp-ink-soft)] hover:border-[var(--bp-blue)] hover:text-[var(--bp-blue-600)]"
            >
              {h}
            </button>
          ))}
          <button
            type="button"
            onClick={clearHistory}
            className="text-[11px] text-[var(--bp-ink-soft)] underline-offset-2 hover:underline"
          >
            Limpiar historial
          </button>
        </div>
      )}

      {knowledgeMatches.length > 0 && (
        <div className="print:hidden flex flex-col gap-1.5 rounded-[var(--bp-radius-md)] border border-dashed border-[var(--bp-blue)]/40 bg-[var(--bp-blue)]/5 p-3">
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

      <div className="print:hidden">
        <TrendsTable
          trends={sorted}
          onOpen={setSelected}
          onTogglePin={(t) => togglePin(t.id)}
          onEdit={(t) => setEditingId(t.id)}
          onDelete={(t) => setDeletingId(t.id)}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
        />
      </div>

      <TrendsPrintableReport trends={exportList} />

      {selected && <TrendDetailModal trend={selected} onClose={() => setSelected(null)} />}

      {editingTrend && (
        <TrendFormModal
          mode="edit"
          initial={editingTrend}
          title={`Editar: ${editingTrend.title}`}
          onClose={() => setEditingId(null)}
          onSubmit={(draft) => {
            updateTrend(editingTrend.id, draft);
            setEditingId(null);
          }}
        />
      )}

      <ConfirmDialog
        open={!!deletingTrend}
        title="Eliminar tendencia"
        description={`¿Seguro que quieres eliminar "${deletingTrend?.title}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        onConfirm={() => {
          if (deletingId) removeTrend(deletingId);
          setDeletingId(null);
        }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}

export default TrendBoard;
