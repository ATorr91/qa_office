import Link from "next/link";
import { notFound } from "next/navigation";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ProjectTimeline from "@/components/projects/ProjectTimeline";
import ActionablesList from "@/components/projects/ActionablesList";
import TrendChart from "@/components/charts/TrendChart";
import SeverityBarChart from "@/components/charts/SeverityBarChart";
import { getProjectById, getStatusBadgeColor, PROJECTS } from "@/lib/projects";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ id: p.id }));
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProjectById(id);
  if (!project) notFound();

  return (
    <div className="flex flex-col gap-5">
      <Link href="/" className="text-[13px] font-semibold text-[var(--bp-blue)] hover:underline">
        ← Volver a proyectos
      </Link>

      <section
        className="rounded-[var(--bp-radius-lg)] p-5 md:p-6"
        style={{ background: "var(--bp-gradient-cover)" }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="eyebrow" style={{ color: "var(--bp-cyan)" }}>
              {project.client} · {project.category}
            </div>
            <h1 className="mt-1.5 text-2xl font-bold text-white">{project.name}</h1>
            <p className="mt-1 max-w-xl text-[13px] text-white/70">{project.description}</p>
          </div>
          <Badge color={getStatusBadgeColor(project.status)}>{project.status}</Badge>
        </div>

        <div className="mt-6">
          <ProjectTimeline startDate={project.startDate} endDate={project.endDate} />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs font-medium text-[var(--bp-ink-soft)]">Tasa de aprobación</div>
          <div className="mt-1.5 text-2xl font-bold text-[var(--bp-ink)]">{project.passRate}%</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium text-[var(--bp-ink-soft)]">Cobertura</div>
          <div className="mt-1.5 text-2xl font-bold text-[var(--bp-ink)]">{project.coverage}%</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium text-[var(--bp-ink-soft)]">Pruebas ejecutadas</div>
          <div className="mt-1.5 text-2xl font-bold text-[var(--bp-ink)]">
            {project.testsExecuted.toLocaleString("es-MX")}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium text-[var(--bp-ink-soft)]">Bugs abiertos</div>
          <div className="mt-1.5 text-2xl font-bold text-[var(--bp-ink)]">{project.bugsOpen}</div>
          {project.bugsCritical > 0 && (
            <div className="mt-0.5 text-[11px] font-medium text-[var(--bp-danger)]">
              {project.bugsCritical} críticos
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="text-[13px] font-semibold text-[var(--bp-ink)]">
            Tendencia de aprobación (8 semanas)
          </h2>
          <div className="mt-3">
            <TrendChart data={project.trend} />
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="text-[13px] font-semibold text-[var(--bp-ink)]">Bugs por severidad</h2>
          <div className="mt-4">
            <SeverityBarChart data={project.bugsBySeverity} />
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="text-[13px] font-semibold text-[var(--bp-ink)]">Resumen</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--bp-ink-soft)]">
          {project.summary}
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
        <Card className="p-4">
          <h2 className="text-[13px] font-semibold text-[var(--bp-ink)]">Accionables</h2>
          <div className="mt-3">
            <ActionablesList actionables={project.actionables} />
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="text-[13px] font-semibold text-[var(--bp-ink)]">Equipo QA</h2>
          <ul className="mt-3 flex flex-col gap-2.5">
            {project.team.map((member) => (
              <li key={member} className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bp-blue-tint)] text-xs font-semibold text-[var(--bp-blue-600)]">
                  {member
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
                <div>
                  <div className="text-[13px] font-medium text-[var(--bp-ink)]">{member}</div>
                  {member === project.qaLead && (
                    <div className="text-[11px] text-[var(--bp-ink-soft)]">QA Lead</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
