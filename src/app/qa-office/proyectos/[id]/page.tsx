import ProjectDetailClient from "@/components/projects/ProjectDetailClient";
import { getProjectById, PROJECTS } from "@/lib/projects";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ id: p.id }));
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const seed = getProjectById(id);

  return <ProjectDetailClient id={id} seed={seed} />;
}
