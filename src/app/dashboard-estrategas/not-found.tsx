import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="mx-auto mt-10 max-w-md rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-6 text-center">
      <h1 className="text-lg font-bold text-[var(--bp-ink)]">No encontramos esa página</h1>
      <p className="mt-1 text-[13px] text-[var(--bp-ink-soft)]">La persona o la sección que buscas no existe en el dashboard de estrategas.</p>
      <Link
        href="/dashboard-estrategas"
        className="bp-tap mt-4 inline-flex items-center gap-1.5 rounded-[var(--bp-radius-sm)] bg-[var(--bp-blue)] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[var(--bp-blue-600)]"
      >
        <span aria-hidden>←</span> Volver al dashboard
      </Link>
    </div>
  );
}
