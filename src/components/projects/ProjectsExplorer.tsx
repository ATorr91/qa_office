"use client";

import { useMemo, useState } from "react";
import ProjectCard from "./ProjectCard";
import Button from "@/components/ui/Button";
import { CATEGORY_OPTIONS, STATUS_OPTIONS, type Project } from "@/lib/projects";

const PAGE_SIZE = 5;

export function ProjectsExplorer({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      const matchesQuery =
        q === "" || p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q);
      const matchesStatus = status === "all" || p.status === status;
      const matchesCategory = category === "all" || p.category === category;
      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [projects, query, status, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function updateFilter(setter: (v: string) => void) {
    return (v: string) => {
      setter(v);
      setPage(1);
    };
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar por proyecto o cliente…"
          className="w-full rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-4 py-2.5 text-sm text-[var(--bp-ink)] outline-none placeholder:text-[var(--bp-ink-soft)] focus:border-[var(--bp-blue)] sm:max-w-sm"
        />
        <select
          value={status}
          onChange={(e) => updateFilter(setStatus)(e.target.value)}
          className="rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-4 py-2.5 text-sm text-[var(--bp-ink)] outline-none focus:border-[var(--bp-blue)]"
        >
          <option value="all">Todos los estados</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => updateFilter(setCategory)(e.target.value)}
          className="rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-4 py-2.5 text-sm text-[var(--bp-ink)] outline-none focus:border-[var(--bp-blue)]"
        >
          <option value="all">Todas las categorías</option>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="text-sm text-[var(--bp-ink-soft)]">
        {filtered.length} proyecto{filtered.length === 1 ? "" : "s"} encontrado
        {filtered.length === 1 ? "" : "s"}
      </div>

      {paginated.length === 0 ? (
        <div className="rounded-[var(--bp-radius-lg)] border border-dashed border-[var(--bp-border)] bg-[var(--bp-surface)] px-6 py-16 text-center text-sm text-[var(--bp-ink-soft)]">
          No encontramos proyectos con esos filtros.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {paginated.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            kind="outline"
            className="px-4 py-2 text-sm"
            disabled={currentPage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`h-8 w-8 rounded-[var(--bp-radius-md)] text-sm font-semibold transition-colors duration-[var(--bp-dur)] ${
                  n === currentPage
                    ? "bg-[var(--bp-blue)] text-white"
                    : "text-[var(--bp-ink-soft)] hover:bg-[var(--bp-surface-alt)]"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <Button
            kind="outline"
            className="px-4 py-2 text-sm"
            disabled={currentPage === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}

export default ProjectsExplorer;
