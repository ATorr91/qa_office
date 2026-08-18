"use client";

import { useMemo, useState } from "react";
import ProjectCard from "./ProjectCard";
import ProjectWizard from "./ProjectWizard";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useProjects } from "@/lib/store";
import { CATEGORY_OPTIONS, STATUS_OPTIONS, type Project } from "@/lib/projects";

const PAGE_SIZE = 5;

type PendingAction = { kind: "pause" | "delete"; project: Project };

export function ProjectsExplorer() {
  const { projects, addProject, updateProject, setStatus, removeProject } = useProjects();
  const [query, setQuery] = useState("");
  const [status, setStatus_] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [wizard, setWizard] = useState<{ mode: "create" | "edit"; project?: Project } | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);

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

  function confirmPending() {
    if (!pending) return;
    if (pending.kind === "delete") {
      removeProject(pending.project.id);
    } else {
      setStatus(pending.project.id, pending.project.status === "Pausado" ? "En curso" : "Pausado");
    }
    setPending(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar por proyecto o cliente…"
          className="w-full rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-3 py-1.5 text-[13px] text-[var(--bp-ink)] outline-none placeholder:text-[var(--bp-ink-soft)] focus:border-[var(--bp-blue)] sm:max-w-xs"
        />
        <select
          value={status}
          onChange={(e) => updateFilter(setStatus_)(e.target.value)}
          className="rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-3 py-1.5 text-[13px] text-[var(--bp-ink)] outline-none focus:border-[var(--bp-blue)]"
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
          className="rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-3 py-1.5 text-[13px] text-[var(--bp-ink)] outline-none focus:border-[var(--bp-blue)]"
        >
          <option value="all">Todas las categorías</option>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span className="text-[12px] text-[var(--bp-ink-soft)] sm:mr-auto">
          {filtered.length} proyecto{filtered.length === 1 ? "" : "s"}
        </span>
        <Button kind="primary" size="sm" onClick={() => setWizard({ mode: "create" })}>
          + Nuevo proyecto
        </Button>
      </div>

      {paginated.length === 0 ? (
        <div className="rounded-[var(--bp-radius-lg)] border border-dashed border-[var(--bp-border)] bg-[var(--bp-surface)] px-6 py-14 text-center text-[13px] text-[var(--bp-ink-soft)]">
          No encontramos proyectos con esos filtros.
        </div>
      ) : (
        <Card className="divide-y divide-[var(--bp-border)] overflow-hidden">
          {paginated.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onEdit={() => setWizard({ mode: "edit", project: p })}
              onTogglePause={() => setPending({ kind: "pause", project: p })}
              onDelete={() => setPending({ kind: "delete", project: p })}
            />
          ))}
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <Button
            kind="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <div className="flex items-center gap-1 font-mono text-[12px]">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`h-6 w-6 rounded-[var(--bp-radius-sm)] font-semibold transition-colors duration-[var(--bp-dur)] ${
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
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Siguiente
          </Button>
        </div>
      )}

      {wizard && (
        <ProjectWizard
          mode={wizard.mode}
          initial={wizard.project}
          onClose={() => setWizard(null)}
          onSubmit={(draft) => {
            if (wizard.mode === "create") addProject(draft);
            else if (wizard.project) updateProject(wizard.project.id, draft);
            setWizard(null);
          }}
        />
      )}

      <ConfirmDialog
        open={pending !== null}
        title={
          pending?.kind === "delete"
            ? `Eliminar "${pending.project.name}"`
            : pending?.project.status === "Pausado"
              ? `Reanudar "${pending?.project.name}"`
              : `Pausar "${pending?.project.name}"`
        }
        description={
          pending?.kind === "delete"
            ? "Esta acción no se puede deshacer. Se eliminará el proyecto y toda su información de QA."
            : pending?.project.status === "Pausado"
              ? "El proyecto volverá a estado \"En curso\"."
              : "El proyecto pasará a estado \"Pausado\" hasta que lo reanudes."
        }
        confirmLabel={pending?.kind === "delete" ? "Eliminar" : "Confirmar"}
        danger={pending?.kind === "delete"}
        onConfirm={confirmPending}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}

export default ProjectsExplorer;
