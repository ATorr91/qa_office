import type { Metadata } from "next";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { DashboardFiltersProvider } from "@/lib/dashboardFilters";
import { StrategistRecordsProvider } from "@/lib/strategistRecords";

export const metadata: Metadata = {
  title: { default: "Dashboard de Estrategas · BluePixel", template: "%s · Dashboard de Estrategas" },
  description: "Evaluación de desempeño, percepción del cliente y autoevaluación del equipo de estrategas.",
};

export default function DashboardEstrategasLayout({ children }: { children: React.ReactNode }) {
  return (
    <StrategistRecordsProvider>
      <DashboardFiltersProvider>
        <div className="flex min-h-screen flex-col bg-[var(--bp-surface-alt)]">
          <DashboardHeader />
          <main className="flex-1 bp-gutter py-6 md:py-7">{children}</main>
          <footer className="no-print border-t border-[var(--bp-border)] bp-gutter py-3 text-center text-[11px] text-[var(--bp-ink-soft)]">
            BluePixel Studio · Dashboard de Estrategas
          </footer>
        </div>
      </DashboardFiltersProvider>
    </StrategistRecordsProvider>
  );
}
