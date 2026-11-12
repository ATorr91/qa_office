import Link from "next/link";

export default function MapaValorServiciosPage() {
  return (
    <div className="relative min-h-screen">
      <Link
        href="/portal"
        className="fixed left-4 top-4 z-10 rounded-full bg-black/40 px-3 py-1.5 text-[12px] font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/60"
      >
        ← Volver al portal
      </Link>
      <iframe
        src="/mapa-valor-servicios.html"
        title="Mapa de valor: Servicios Strategist"
        className="block h-screen w-full border-0"
      />
    </div>
  );
}
