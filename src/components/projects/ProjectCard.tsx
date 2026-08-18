"use client";

import { useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import ProjectThumbnail from "./ProjectThumbnail";
import { getStatusBadgeColor, type Project } from "@/lib/projects";

export function ProjectCard({
  project,
  onEdit,
  onTogglePause,
  onDelete,
}: {
  project: Project;
  onEdit: () => void;
  onTogglePause: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bp-row-in relative flex items-center gap-3 px-4 py-3 transition-colors duration-[var(--bp-dur)] hover:bg-[var(--bp-surface-alt)]">
      <Link href={`/qa-office/proyectos/${project.id}`} className="flex flex-1 items-center gap-3 min-w-0">
        <ProjectThumbnail category={project.category} className="h-10 w-10" />

        <div className="min-w-0 flex-1 sm:w-56 sm:flex-none">
          <div className="truncate text-sm font-semibold text-[var(--bp-ink)]">{project.name}</div>
          <div className="mt-0.5 truncate text-[11px] uppercase tracking-[0.06em] text-[var(--bp-ink-soft)]">
            {project.client} · {project.category}
          </div>
        </div>

        <div className="hidden flex-1 items-center gap-5 font-mono text-xs text-[var(--bp-ink-soft)] md:flex">
          <Stat label="Aprob." value={`${project.passRate}%`} />
          <Stat label="Cob." value={`${project.coverage}%`} />
          <Stat label="Bugs" value={String(project.bugsOpen)} warn={project.bugsCritical > 0} />
        </div>

        <div className="hidden shrink-0 font-mono text-xs text-[var(--bp-ink-soft)] lg:block">
          {project.lastReportDate}
        </div>

        <div className="shrink-0">
          <Badge color={getStatusBadgeColor(project.status)}>{project.status}</Badge>
        </div>

        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="hidden h-3.5 w-3.5 shrink-0 text-[var(--bp-ink-soft)] sm:block"
        >
          <path
            d="M6 3l5 5-5 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>

      <div className="relative shrink-0">
        <button
          type="button"
          aria-label="Más acciones"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
          className="flex h-7 w-7 items-center justify-center rounded-[var(--bp-radius-sm)] text-[var(--bp-ink-soft)] hover:bg-[var(--bp-surface-alt)]"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4">
            <circle cx="8" cy="3" r="1.3" fill="currentColor" />
            <circle cx="8" cy="8" r="1.3" fill="currentColor" />
            <circle cx="8" cy="13" r="1.3" fill="currentColor" />
          </svg>
        </button>
        {menuOpen && (
          <div className="absolute right-0 z-10 mt-1 w-36 overflow-hidden rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] shadow-[var(--bp-shadow-md)]">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onEdit();
              }}
              className="block w-full px-3 py-2 text-left text-[12px] text-[var(--bp-ink)] hover:bg-[var(--bp-surface-alt)]"
            >
              Editar
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onTogglePause();
              }}
              className="block w-full px-3 py-2 text-left text-[12px] text-[var(--bp-ink)] hover:bg-[var(--bp-surface-alt)]"
            >
              {project.status === "Pausado" ? "Reanudar" : "Pausar"}
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onDelete();
              }}
              className="block w-full px-3 py-2 text-left text-[12px] text-[var(--bp-danger)] hover:bg-[var(--bp-surface-alt)]"
            >
              Eliminar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <span>
      <span className="text-[var(--bp-ink-soft)]/70">{label} </span>
      <span className={warn ? "text-[var(--bp-danger)]" : "text-[var(--bp-ink)]"}>{value}</span>
    </span>
  );
}

export default ProjectCard;
