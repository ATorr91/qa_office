import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProyectoView from "@/components/dashboard/cerebro/ProyectoView";
import { catalogProjectById, PROJECT_CATALOG, projectIdOf } from "@/lib/projectCatalog";

export function generateStaticParams() {
  return PROJECT_CATALOG.map((p) => ({ id: projectIdOf(p) }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const project = catalogProjectById(decodeURIComponent(id));
  return { title: project ? project.name : "Proyecto no encontrado" };
}

export default async function ProyectoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectId = decodeURIComponent(id);
  if (!catalogProjectById(projectId)) notFound();
  return <ProyectoView projectId={projectId} />;
}
