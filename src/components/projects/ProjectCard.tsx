import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { getStatusBadgeColor, type Project } from "@/lib/projects";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/proyectos/${project.id}`} className="block">
      <Card className="p-5 transition-shadow duration-[var(--bp-dur)] hover:shadow-[var(--bp-shadow-md)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--bp-ink-soft)]">
              {project.client} · {project.category}
            </div>
            <h3 className="mt-1 text-lg font-bold text-[var(--bp-ink)]">{project.name}</h3>
          </div>
          <Badge color={getStatusBadgeColor(project.status)}>{project.status}</Badge>
        </div>

        <p className="mt-3 text-sm text-[var(--bp-ink-soft)]">{project.description}</p>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--bp-border)] pt-4 sm:grid-cols-4">
          <Metric label="Aprobación" value={`${project.passRate}%`} />
          <Metric label="Cobertura" value={`${project.coverage}%`} />
          <Metric
            label="Bugs abiertos"
            value={String(project.bugsOpen)}
            detail={project.bugsCritical > 0 ? `${project.bugsCritical} críticos` : undefined}
          />
          <Metric label="Último reporte" value={project.lastReportDate} />
        </div>
      </Card>
    </Link>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div>
      <div className="text-xs text-[var(--bp-ink-soft)]">{label}</div>
      <div className="text-base font-semibold text-[var(--bp-ink)]">{value}</div>
      {detail && <div className="text-xs text-[var(--bp-danger)]">{detail}</div>}
    </div>
  );
}

export default ProjectCard;
