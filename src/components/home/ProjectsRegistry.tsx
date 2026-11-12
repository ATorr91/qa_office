"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { isExternalHref, normalizeHref, OWNERS, usePortalProjects, type PortalProject } from "@/lib/portalProjects";

type ProjectDraft = Pick<PortalProject, "title" | "project" | "description" | "owner"> & { href: string };

const PAGE_SIZES = [5, 10, 20] as const;
const EMPTY_DRAFT: ProjectDraft = { title: "", project: "", description: "", owner: "", href: "" };
const EXIT_MS = 200;
const MODAL_EXIT_MS = 180;

const FIELD_CLASS =
  "w-full rounded-[var(--bp-radius-sm)] border border-white/20 bg-white/10 px-3 py-2 text-[13px] text-white outline-none transition-[border-color,box-shadow,background-color] duration-[var(--bp-dur)] placeholder:text-white/40 hover:border-white/35 focus:border-[var(--bp-cyan)] focus:bg-white/[0.14] focus:shadow-[0_0_0_3px_rgba(0,193,211,0.18)]";

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

const SearchIcon = () => (
  <svg {...ICON_PROPS} className="h-4 w-4">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);
const XIcon = () => (
  <svg {...ICON_PROPS} className="h-3.5 w-3.5">
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
const PlusIcon = () => (
  <svg {...ICON_PROPS} className="h-4 w-4 transition-transform duration-[var(--bp-dur)] group-hover/new:rotate-90">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const ChevronIcon = () => (
  <svg {...ICON_PROPS} className="h-3.5 w-3.5">
    <path d="m6 9 6 6 6-6" />
  </svg>
);
const PencilIcon = () => (
  <svg {...ICON_PROPS} className="h-4 w-4">
    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);
const TrashIcon = () => (
  <svg {...ICON_PROPS} className="h-4 w-4">
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" />
  </svg>
);

function FilterSelect({
  value,
  onChange,
  label,
  allLabel,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  allLabel: string;
  options: string[];
}) {
  const active = value !== "";
  return (
    <div className="relative min-w-0 sm:w-48">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        style={{ colorScheme: "dark" }}
        className={`${FIELD_CLASS} cursor-pointer appearance-none truncate pr-8 ${
          active ? "!border-[var(--bp-cyan)] !bg-[rgba(0,193,211,0.14)]" : ""
        }`}
      >
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/55">
        <ChevronIcon />
      </span>
    </div>
  );
}

/** Animated modal shell: fades/scales in, and plays the exit animation while `closing` is true (the parent unmounts it afterwards). */
function Modal({ title, closing, onClose, children }: { title: string; closing: boolean; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm ${
        closing ? "bp-modal-overlay-out" : "bp-modal-overlay"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full max-w-lg rounded-[var(--bp-radius-lg)] border border-white/15 bg-gradient-to-br from-[var(--bp-navy)] to-[var(--bp-navy-deep)] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.5)] ${
          closing ? "bp-modal-panel-out" : "bp-modal-panel"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="project-modal-title" className="text-lg font-bold text-white">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="bp-tap -mr-1 -mt-1 rounded-full p-1.5 text-white/55 transition-colors hover:bg-white/10 hover:text-white"
          >
            <XIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ProjectForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: ProjectDraft;
  submitLabel: string;
  onSubmit: (draft: ProjectDraft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState<{ text: string; n: number } | null>(null);

  function update(field: keyof ProjectDraft, value: string) {
    setDraft((d) => ({ ...d, [field]: value }));
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean: Omit<ProjectDraft, "href"> = {
      title: draft.title.trim(),
      project: draft.project.trim(),
      description: draft.description.trim(),
      owner: draft.owner.trim(),
    };
    if (!clean.title || !clean.project || !clean.owner) {
      setError({ text: "Título, proyecto y responsable son obligatorios.", n: (error?.n ?? 0) + 1 });
      return;
    }
    let href = "";
    if (draft.href.trim() !== "") {
      const normalized = normalizeHref(draft.href);
      if (!normalized) {
        setError({ text: "Escribe un enlace válido: https://… o una ruta como /mi-seccion.", n: (error?.n ?? 0) + 1 });
        return;
      }
      href = normalized;
    }
    onSubmit({ ...clean, href });
  }

  const labelClass = "bp-row-in flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-white/60";

  return (
    <form onSubmit={handleSubmit} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <label className={labelClass} style={{ animationDelay: "60ms" }}>
        Título
        <input
          autoFocus
          value={draft.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="ej. Rediseño del portal"
          className={FIELD_CLASS}
        />
      </label>
      <label className={labelClass} style={{ animationDelay: "110ms" }}>
        Proyecto
        <input
          value={draft.project}
          onChange={(e) => update("project", e.target.value)}
          placeholder="ej. APAC"
          className={FIELD_CLASS}
        />
      </label>
      <label className={`${labelClass} sm:col-span-2`} style={{ animationDelay: "160ms" }}>
        Descripción
        <textarea
          value={draft.description}
          onChange={(e) => update("description", e.target.value)}
          rows={3}
          placeholder="¿De qué trata el proyecto?"
          className={`${FIELD_CLASS} resize-y`}
        />
      </label>
      <label className={labelClass} style={{ animationDelay: "210ms" }}>
        Responsable
        <div className="relative">
          <select
            value={draft.owner}
            onChange={(e) => update("owner", e.target.value)}
            style={{ colorScheme: "dark" }}
            className={`${FIELD_CLASS} cursor-pointer appearance-none pr-8 ${draft.owner ? "" : "text-white/40"}`}
          >
            <option value="">Selecciona…</option>
            {OWNERS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/55">
            <ChevronIcon />
          </span>
        </div>
      </label>
      <label className={labelClass} style={{ animationDelay: "260ms" }}>
        Enlace web (opcional)
        <input
          value={draft.href}
          onChange={(e) => update("href", e.target.value)}
          placeholder="https://mi-proyecto.vercel.app"
          inputMode="url"
          className={FIELD_CLASS}
        />
      </label>
      <div className="flex items-center justify-end gap-3 sm:col-span-2">
        {error && (
          <span key={error.n} className="bp-shake mr-auto text-[12px] font-medium text-[#ff8fb0]" role="alert">
            {error.text}
          </span>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="bp-tap rounded-[var(--bp-radius-md)] px-3 py-2 text-[13px] font-medium text-white/70 transition-colors hover:text-white"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="bp-tap rounded-[var(--bp-radius-md)] bg-[var(--bp-blue)] px-4 py-2 text-[13px] font-semibold text-white transition-all duration-[var(--bp-dur)] hover:-translate-y-px hover:bg-[var(--bp-blue-400)] hover:shadow-[0_6px_18px_rgba(22,161,205,0.45)]"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export function ProjectsRegistry() {
  const { projects, setProjects, hydrated } = usePortalProjects();

  const [modal, setModal] = useState<{ mode: "create" } | { mode: "edit"; id: string } | null>(null);
  const [modalClosing, setModalClosing] = useState(false);
  const [toDelete, setToDelete] = useState<PortalProject | null>(null);
  const [leavingId, setLeavingId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(20);
  const [page, setPage] = useState(1);
  const searchRef = useRef<HTMLInputElement>(null);

  // "/" jumps to the search box (unless the user is already typing somewhere).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing = el instanceof HTMLElement && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
      if (e.key === "/" && !typing && !modal) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal]);

  const projectKeys = useMemo(() => [...new Set(projects.map((p) => p.project))].sort((a, b) => a.localeCompare(b)), [projects]);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return projects
      .filter((p) => (ownerFilter ? p.owner === ownerFilter : true))
      .filter((p) => (projectFilter ? p.project === projectFilter : true))
      .filter((p) => (q ? normalize(`${p.title} ${p.project} ${p.description} ${p.owner}`).includes(q) : true))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [projects, query, ownerFilter, projectFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(startIdx, startIdx + pageSize);
  const filtersActive = query !== "" || ownerFilter !== "" || projectFilter !== "";
  const editing = modal?.mode === "edit" ? projects.find((p) => p.id === modal.id) ?? null : null;

  function flash(id: string) {
    setHighlightId(id);
    window.setTimeout(() => setHighlightId((cur) => (cur === id ? null : cur)), 1500);
  }

  function openModal(next: NonNullable<typeof modal>) {
    setModalClosing(false);
    setModal(next);
  }

  function closeModal() {
    setModalClosing(true);
    window.setTimeout(() => {
      setModal(null);
      setModalClosing(false);
    }, MODAL_EXIT_MS);
  }

  function handleCreate(draft: ProjectDraft) {
    const { href, ...rest } = draft;
    const created: PortalProject = { id: newId(), createdAt: Date.now(), ...rest, ...(href ? { href } : {}) };
    setProjects((prev) => [created, ...prev]);
    setPage(1);
    closeModal();
    flash(created.id);
  }

  function handleEdit(id: string, draft: ProjectDraft) {
    const { href, ...rest } = draft;
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...rest, href: href || undefined } : p)));
    closeModal();
    flash(id);
  }

  function handleDelete(target: PortalProject) {
    setToDelete(null);
    setLeavingId(target.id);
    window.setTimeout(() => {
      setProjects((prev) => prev.filter((p) => p.id !== target.id));
      setLeavingId(null);
    }, EXIT_MS);
  }

  function clearFilters() {
    setQuery("");
    setOwnerFilter("");
    setProjectFilter("");
    setPage(1);
  }

  const pagerBtn =
    "bp-tap rounded-[var(--bp-radius-sm)] border border-white/20 px-3 py-1 text-white transition-all duration-[var(--bp-dur)] hover:-translate-y-px hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0 disabled:hover:bg-transparent";
  const iconBtn =
    "bp-tap rounded-full p-1.5 text-white/55 opacity-70 transition-all duration-[var(--bp-dur)] focus-visible:opacity-100 group-hover:opacity-100";

  return (
    <section className="bp-anim-page mt-10 w-full max-w-5xl" aria-labelledby="projects-registry-title">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id="projects-registry-title" className="text-2xl font-bold text-white">
          Proyectos, iniciativas y experimentación del depto de estrategas
        </h2>
        <span className="text-[13px] text-white/55">{hydrated ? `${projects.length} registrados` : "Cargando…"}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 lg:flex-nowrap">
        <div className="group/search relative min-w-[220px] flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/45 transition-colors duration-[var(--bp-dur)] group-focus-within/search:text-[var(--bp-cyan)]">
            <SearchIcon />
          </span>
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setQuery("");
                e.currentTarget.blur();
              }
            }}
            placeholder="Buscar proyecto, descripción o responsable…"
            aria-label="Buscar proyectos"
            className={`${FIELD_CLASS} pl-9 pr-14 [&::-webkit-search-cancel-button]:hidden`}
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setPage(1);
                searchRef.current?.focus();
              }}
              aria-label="Borrar búsqueda"
              className="bp-anim-pop bp-tap absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/55 transition-colors hover:bg-white/10 hover:text-white"
            >
              <XIcon />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-white/20 px-1.5 py-px font-mono text-[10px] text-white/40">
              /
            </kbd>
          )}
        </div>

        <FilterSelect
          value={ownerFilter}
          onChange={(v) => {
            setOwnerFilter(v);
            setPage(1);
          }}
          label="Filtrar por responsable"
          allLabel="Responsable"
          options={[...OWNERS]}
        />
        <FilterSelect
          value={projectFilter}
          onChange={(v) => {
            setProjectFilter(v);
            setPage(1);
          }}
          label="Filtrar por proyecto"
          allLabel="Proyecto"
          options={projectKeys}
        />

        {filtersActive && (
          <button
            type="button"
            onClick={clearFilters}
            className="bp-anim-pop bp-tap shrink-0 whitespace-nowrap px-1 text-[12px] font-medium text-[var(--bp-cyan)] hover:underline"
          >
            Limpiar
          </button>
        )}

        <button
          type="button"
          onClick={() => openModal({ mode: "create" })}
          className="group/new bp-tap inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[var(--bp-radius-md)] bg-[var(--bp-blue)] px-4 py-2 text-[13px] font-semibold text-white transition-all duration-[var(--bp-dur)] hover:-translate-y-px hover:bg-[var(--bp-blue-400)] hover:shadow-[0_6px_18px_rgba(22,161,205,0.45)]"
        >
          <PlusIcon />
          Nuevo proyecto
        </button>
      </div>

      <div className="mt-3 overflow-x-auto rounded-[var(--bp-radius-lg)] border border-white/15 bg-white/5 backdrop-blur-sm">
        <table className="w-full min-w-[760px] border-collapse text-left text-[13px] text-white">
          <thead>
            <tr className="border-b border-white/15 text-[10px] uppercase tracking-[0.04em] text-white/55">
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Proyecto</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3">Responsable</th>
              <th className="px-4 py-3 text-right">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {!hydrated ? null : pageRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="bp-anim-page px-4 py-12 text-center text-[13px] text-white/55">
                  {projects.length === 0
                    ? "Aún no hay proyectos. Crea el primero con “Nuevo proyecto”."
                    : "Ningún proyecto coincide con la búsqueda o los filtros."}
                </td>
              </tr>
            ) : (
              pageRows.map((p, i) => {
                const flashClass = highlightId === p.id ? "bp-flash" : "";
                return (
                  <tr
                    key={p.id}
                    className={`group border-b border-white/10 transition-colors duration-[var(--bp-dur)] last:border-0 hover:bg-white/[0.06] ${
                      leavingId === p.id ? "bp-row-out" : "bp-row-in"
                    }`}
                    style={{ animationDelay: leavingId === p.id ? "0ms" : `${Math.min(i, 12) * 35}ms` }}
                  >
                    <td className={`px-4 py-3 font-semibold transition-shadow duration-[var(--bp-dur)] group-hover:shadow-[inset_3px_0_0_var(--bp-cyan)] ${flashClass}`}>
                      {p.href ? (
                        isExternalHref(p.href) ? (
                          <a
                            href={p.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--bp-cyan)]"
                          >
                            {p.title}
                            <span aria-hidden className="-translate-x-1 opacity-0 transition-all duration-[var(--bp-dur)] group-hover:translate-x-0 group-hover:opacity-100">
                              ↗
                            </span>
                          </a>
                        ) : (
                          <Link href={p.href} className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--bp-cyan)]">
                            {p.title}
                            <span aria-hidden className="-translate-x-1 opacity-0 transition-all duration-[var(--bp-dur)] group-hover:translate-x-0 group-hover:opacity-100">
                              →
                            </span>
                          </Link>
                        )
                      ) : (
                        p.title
                      )}
                    </td>
                    <td className={`px-4 py-3 ${flashClass}`}>
                      <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-[11px] text-[var(--bp-cyan)] transition-colors duration-[var(--bp-dur)] group-hover:bg-[rgba(0,193,211,0.18)]">
                        {p.project}
                      </span>
                    </td>
                    <td className={`max-w-xs px-4 py-3 text-white/70 ${flashClass}`}>{p.description || "—"}</td>
                    <td className={`px-4 py-3 ${flashClass}`}>{p.owner || <span className="text-white/40">Sin asignar</span>}</td>
                    <td className={`px-4 py-3 text-right ${flashClass}`}>
                      <div className="inline-flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => openModal({ mode: "edit", id: p.id })}
                          aria-label={`Editar ${p.title}`}
                          data-tip="Editar"
                          className={`${iconBtn} hover:bg-white/10 hover:text-[var(--bp-cyan)]`}
                        >
                          <PencilIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => setToDelete(p)}
                          aria-label={`Eliminar ${p.title}`}
                          data-tip="Eliminar"
                          className={`${iconBtn} hover:bg-[rgba(255,143,176,0.14)] hover:text-[#ff8fb0]`}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[12px] text-white/65">
        <div className="flex items-center gap-2">
          <span>
            {filtered.length === 0 ? "0 resultados" : `${startIdx + 1}–${Math.min(startIdx + pageSize, filtered.length)} de ${filtered.length}`}
          </span>
          <label className="flex items-center gap-1.5">
            <span className="sr-only">Filas por página</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value) as (typeof PAGE_SIZES)[number]);
                setPage(1);
              }}
              className="cursor-pointer rounded-[var(--bp-radius-sm)] border border-white/20 bg-white/10 px-2 py-1 text-[12px] text-white outline-none transition-colors hover:border-white/35 focus:border-[var(--bp-cyan)]"
              style={{ colorScheme: "dark" }}
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n} por página
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1} className={pagerBtn}>
            Anterior
          </button>
          <span>
            Página {currentPage} de {totalPages}
          </span>
          <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= totalPages} className={pagerBtn}>
            Siguiente
          </button>
        </div>
      </div>

      {modal && (modal.mode === "create" || editing) && (
        <Modal title={modal.mode === "create" ? "Nuevo proyecto" : "Editar proyecto"} closing={modalClosing} onClose={closeModal}>
          <ProjectForm
            key={modal.mode === "edit" ? modal.id : "create"}
            initial={editing ? { title: editing.title, project: editing.project, description: editing.description, owner: editing.owner, href: editing.href ?? "" } : EMPTY_DRAFT}
            submitLabel={modal.mode === "create" ? "Guardar proyecto" : "Guardar cambios"}
            onSubmit={(draft) => (modal.mode === "create" ? handleCreate(draft) : handleEdit(modal.id, draft))}
            onCancel={closeModal}
          />
        </Modal>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar proyecto"
        description={
          toDelete
            ? `Se eliminará “${toDelete.title}” de la lista. Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Eliminar"
        danger
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && handleDelete(toDelete)}
      />
    </section>
  );
}

export default ProjectsRegistry;
