import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { DashboardFiltersProvider } from "@/lib/dashboardFilters";
import { StrategistRecordsProvider } from "@/lib/strategistRecords";

export default function DashboardEstrategasLayout({ children }: { children: React.ReactNode }) {
  return (
    <StrategistRecordsProvider>
      <DashboardFiltersProvider>
        <div className="flex min-h-screen flex-col bg-[var(--bp-surface-alt)]">
          <DashboardHeader />
          <main className="flex-1 px-5 py-6 md:px-8 md:py-7">{children}</main>
          <footer className="no-print border-t border-[var(--bp-border)] px-5 py-3 text-center text-[11px] text-[var(--bp-ink-soft)] md:px-8">
            BluePixel Studio · Dashboard de Estrategas
          </footer>
        </div>
      </DashboardFiltersProvider>
    </StrategistRecordsProvider>
  );
}
