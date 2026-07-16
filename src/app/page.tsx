import ProjectsExplorer from "@/components/projects/ProjectsExplorer";
import { PROJECTS } from "@/lib/projects";

export default function Home() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="eyebrow">QA Office</div>
        <h1 className="mt-2 text-3xl font-bold text-[var(--bp-ink)]">Proyectos</h1>
        <p className="mt-1 text-[var(--bp-ink-soft)]">
          Métricas del departamento de calidad sobre los proyectos activos de la empresa.
        </p>
      </div>

      <ProjectsExplorer projects={PROJECTS} />
    </div>
  );
}
