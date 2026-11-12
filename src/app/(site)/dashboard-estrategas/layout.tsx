import type { Metadata } from "next";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { DashboardFiltersProvider } from "@/lib/dashboardFilters";
import { ProjectProcessProvider } from "@/lib/projectProcess";
import { StrategistRecordsProvider } from "@/lib/strategistRecords";

export const metadata: Metadata = {
  title: { default: "Dashboard de Estrategas", template: "%s · Dashboard de Estrategas" },
  description: "Evaluación de desempeño, percepción del cliente y autoevaluación del equipo de estrategas.",
};

export default function DashboardEstrategasLayout({ children }: { children: React.ReactNode }) {
  return (
    <StrategistRecordsProvider>
      <DashboardFiltersProvider>
        <ProjectProcessProvider>
          <div className="flex min-h-screen flex-col">
            <DashboardHeader />
            <main className="flex-1 bp-gutter py-6 md:py-7">{children}</main>
          </div>
        </ProjectProcessProvider>
      </DashboardFiltersProvider>
    </StrategistRecordsProvider>
  );
}
