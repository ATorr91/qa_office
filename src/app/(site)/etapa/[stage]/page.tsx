import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StageView from "@/components/proceso/StageView";
import { STAGES } from "@/lib/procesoStages";
import type { StageId } from "@/lib/procesoTypes";

export function generateStaticParams() {
  return STAGES.map((s) => ({ stage: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ stage: string }> }): Promise<Metadata> {
  const { stage } = await params;
  const found = STAGES.find((s) => s.id === stage);
  return { title: found ? `${found.number}. ${found.name}` : "Etapa no encontrada" };
}

export default async function StagePage({ params }: { params: Promise<{ stage: string }> }) {
  const { stage } = await params;
  if (!STAGES.some((s) => s.id === stage)) notFound();
  return <StageView stageId={stage as StageId} />;
}
