"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ProjectTimeline from "@/components/projects/ProjectTimeline";
import ActionablesList from "@/components/projects/ActionablesList";
import TeamCard from "@/components/projects/TeamCard";
import ReportHistoryPanel from "@/components/projects/ReportHistoryPanel";
import ProjectWizard from "@/components/projects/ProjectWizard";
import PrintableReport from "@/components/projects/PrintableReport";
import TrendChart from "@/components/charts/TrendChart";
import SeverityBarChart from "@/components/charts/SeverityBarChart";
import { useProjects } from "@/lib/store";
import { getStatusBadgeColor, type Project } from "@/lib/projects";

export function ProjectDetailView({ project }: { project: Project }) {
  const router = useRouter();
  const { updateProject, setStatus, removeProject } = useProjects();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [pending, setPending] = useState<"pause" | "delete" | null>(null);

  function confirmPending() {
    if (pending === "delete") {
      removeProject(project.id);
      router.push("/qa-office");
    } else if (pending === "pause") {
      setStatus(project.id, project.status === "Pausado" ? "En curso" : "Pausado");
    }
    setPending(null);
  }

  return (
    <div className="bp-anim-page flex flex-col gap-5">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link href="/qa-office" className="text-[13px] font-semibold text-[var(--bp-blue)] hover:underline">
          ← Volver a proyectos
        </Link>
        <div className="flex gap-2">
          <Button kind="outline" size="sm" onClick={() => setWizardOpen(true)}>
            Editar
          </Button>
          <Button kind="outline" size="sm" onClick={() => setPending("pause")}>
            {project.status === "Pausado" ? "Reanudar" : "Pausar"}
          </Button>
          <Button
            kind="outline"
            size="sm"
            className="!border-[var(--bp-danger)] !text-[var(--bp-danger)]"
            onClick={() => setPending("delete")}
          >
            Eliminar
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-5 print:hidden">
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
          <ProjectTimeline project={project} />
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

      <ReportHistoryPanel project={project} />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
        <Card className="p-4">
          <h2 className="text-[13px] font-semibold text-[var(--bp-ink)]">Accionables</h2>
          <div className="mt-3">
            <ActionablesList actionables={project.actionables} />
          </div>
        </Card>
        <TeamCard team={project.team} />
      </div>
      </div>

      <PrintableReport project={project} />

      {wizardOpen && (
        <ProjectWizard
          mode="edit"
          initial={project}
          onClose={() => setWizardOpen(false)}
          onSubmit={(draft) => {
            updateProject(project.id, draft);
            setWizardOpen(false);
          }}
        />
      )}

      <ConfirmDialog
        open={pending !== null}
        title={
          pending === "delete"
            ? `Eliminar "${project.name}"`
            : project.status === "Pausado"
              ? `Reanudar "${project.name}"`
              : `Pausar "${project.name}"`
        }
        description={
          pending === "delete"
            ? "Esta acción no se puede deshacer. Se eliminará el proyecto y toda su información de QA."
            : project.status === "Pausado"
              ? "El proyecto volverá a estado \"En curso\"."
              : "El proyecto pasará a estado \"Pausado\" hasta que lo reanudes."
        }
        confirmLabel={pending === "delete" ? "Eliminar" : "Confirmar"}
        danger={pending === "delete"}
        onConfirm={confirmPending}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}

export default ProjectDetailView;
