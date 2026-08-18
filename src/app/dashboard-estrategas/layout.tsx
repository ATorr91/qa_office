import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { DashboardFiltersProvider } from "@/lib/dashboardFilters";
import { StrategistRecordsProvider } from "@/lib/strategistRecords";

export default function DashboardEstrategasLayout({ children }: { children: React.ReactNode }) {
  return (
    <StrategistRecordsProvider>
      <DashboardFiltersProvider>
        <div className="min-h-screen bg-[var(--bp-surface-alt)]">
          <DashboardHeader />
          <main className="px-5 py-6 md:px-8 md:py-7">{children}</main>
        </div>
      </DashboardFiltersProvider>
    </StrategistRecordsProvider>
  );
}
