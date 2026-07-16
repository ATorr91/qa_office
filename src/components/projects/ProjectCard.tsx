import Link from "next/link";
import Badge from "@/components/ui/Badge";
import ProjectThumbnail from "./ProjectThumbnail";
import { getStatusBadgeColor, type Project } from "@/lib/projects";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/proyectos/${project.id}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors duration-[var(--bp-dur)] hover:bg-[var(--bp-surface-alt)]"
    >
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
        <Stat
          label="Bugs"
          value={String(project.bugsOpen)}
          warn={project.bugsCritical > 0}
        />
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
