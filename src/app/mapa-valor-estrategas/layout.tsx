import Link from "next/link";
import Logo from "@/components/brand/Logo";

export default function MapaValorEstrategasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bp-surface-alt)]">
      <header className="flex items-center justify-between border-b border-[var(--bp-border)] bg-[var(--bp-surface)] bp-gutter py-3">
        <Link href="/portal" aria-label="Volver al portal">
          <Logo variant="dark" style={{ transform: "scale(0.65)", transformOrigin: "left center" }} />
        </Link>
        <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--bp-ink-soft)]">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--bp-purple)" }} />
          Mapa de Valor de Estrategas
        </div>
      </header>
      <main className="bp-gutter py-6 md:py-7">{children}</main>
    </div>
  );
}
