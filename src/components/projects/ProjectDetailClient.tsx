"use client";

import Link from "next/link";
import ProjectDetailView from "./ProjectDetailView";
import { useProjects } from "@/lib/store";
import type { Project } from "@/lib/projects";

export function ProjectDetailClient({ id, seed }: { id: string; seed?: Project }) {
  const { getProject, hydrated } = useProjects();
  const project = getProject(id) ?? (hydrated ? undefined : seed);

  if (!project) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <h1 className="text-xl font-semibold text-[var(--bp-ink)]">Proyecto no encontrado</h1>
        <p className="text-[13px] text-[var(--bp-ink-soft)]">
          Puede que haya sido eliminado o que el enlace sea incorrecto.
        </p>
        <Link href="/qa-office" className="text-[13px] font-semibold text-[var(--bp-blue)] hover:underline">
          ← Volver a proyectos
        </Link>
      </div>
    );
  }

  return <ProjectDetailView project={project} />;
}

export default ProjectDetailClient;
