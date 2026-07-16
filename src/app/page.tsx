import Card from "@/components/ui/Card";
import Badge, { type BadgeColor } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const METRICS = [
  { label: "Pruebas ejecutadas", value: "1,284", detail: "últimos 7 días" },
  { label: "Tasa de aprobación", value: "94.2%", detail: "+1.8 pts vs. semana pasada" },
  { label: "Bugs abiertos", value: "23", detail: "6 críticos" },
  { label: "Cobertura", value: "78%", detail: "meta: 85%" },
];

const STATUS_COLOR: Record<string, BadgeColor> = {
  Aprobado: "success",
  "En revisión": "warning",
  Bloqueado: "danger",
  Pendiente: "neutral",
};

const REPORTS = [
  { project: "App Móvil Pagos", date: "15 jul 2026", status: "Aprobado", passRate: "97%" },
  { project: "Portal Clientes", date: "14 jul 2026", status: "En revisión", passRate: "88%" },
  { project: "API Facturación", date: "13 jul 2026", status: "Bloqueado", passRate: "61%" },
  { project: "Checkout Web", date: "12 jul 2026", status: "Aprobado", passRate: "95%" },
  { project: "Panel Interno", date: "11 jul 2026", status: "Pendiente", passRate: "—" },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="eyebrow">QA Office</div>
          <h1 className="mt-2 text-3xl font-bold text-[var(--bp-ink)]">
            Reportes instantáneos de QA
          </h1>
          <p className="mt-1 text-[var(--bp-ink-soft)]">
            Métricas del departamento de calidad sobre los proyectos activos de la empresa.
          </p>
        </div>
        <Button kind="primary">Generar reporte</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((m) => (
          <Card key={m.label} className="p-5">
            <div className="text-sm font-medium text-[var(--bp-ink-soft)]">{m.label}</div>
            <div className="mt-2 text-3xl font-bold text-[var(--bp-ink)]">{m.value}</div>
            <div className="mt-1 text-xs text-[var(--bp-ink-soft)]">{m.detail}</div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-[var(--bp-border)] px-5 py-4">
          <h2 className="text-lg font-semibold text-[var(--bp-ink)]">Reportes recientes</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-[var(--bp-ink-soft)]">
              <th className="px-5 py-3 font-medium">Proyecto</th>
              <th className="px-5 py-3 font-medium">Fecha</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              <th className="px-5 py-3 font-medium">Tasa de aprobación</th>
            </tr>
          </thead>
          <tbody>
            {REPORTS.map((r) => (
              <tr key={r.project} className="border-t border-[var(--bp-border)]">
                <td className="px-5 py-3 font-medium text-[var(--bp-ink)]">{r.project}</td>
                <td className="px-5 py-3 text-[var(--bp-ink-soft)]">{r.date}</td>
                <td className="px-5 py-3">
                  <Badge color={STATUS_COLOR[r.status]}>{r.status}</Badge>
                </td>
                <td className="px-5 py-3 text-[var(--bp-ink-soft)]">{r.passRate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
