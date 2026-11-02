import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StrategistOnePager from "@/components/dashboard/StrategistOnePager";
import { STRATEGISTS } from "@/lib/strategists";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const strategist = STRATEGISTS.find((s) => s.id === id);
  return { title: strategist ? `Perfil de ${strategist.name}` : "Perfil no encontrado" };
}

export default async function PerfilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!STRATEGISTS.some((s) => s.id === id)) notFound();
  return <StrategistOnePager strategistId={id} />;
}
