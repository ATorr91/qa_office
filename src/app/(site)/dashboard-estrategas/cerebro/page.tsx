import type { Metadata } from "next";
import CerebroView from "@/components/dashboard/cerebro/CerebroView";

export const metadata: Metadata = { title: "Cerebro" };

export default function CerebroPage() {
  return <CerebroView />;
}
