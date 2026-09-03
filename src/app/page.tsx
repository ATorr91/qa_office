import Link from "next/link";
import Logo from "@/components/brand/Logo";

const DESTINATIONS = [
  {
    href: "/qa-office",
    title: "QA Office",
    description:
      "Reportes instantáneos de métricas de QA: proyectos, timelines, bugs por severidad y accionables.",
    accent: "var(--bp-blue)",
    icon: (
      <path
        d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/estrategas",
    title: "Trend Hunting",
    description:
      "Radar de tendencias para trend hunting: señales de mercado, tecnología y diseño UX/UI antes de que sean mainstream.",
    accent: "var(--bp-magenta)",
    icon: (
      <path
        d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/dashboard-estrategas",
    title: "Dashboard de Estrategas",
    description:
      "Panel de control para el equipo de estrategas: próximamente, indicadores y seguimiento del trabajo estratégico en un solo lugar.",
    accent: "var(--bp-green)",
    icon: (
      <path
        d="M3 20h18M6 20V13M12 20V7M18 20V11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/mapa-valor-estrategas",
    title: "Mapa de Valor de Estrategas",
    description:
      "Próximamente: visualiza en qué proyectos y cuentas está generando valor cada estratega, y dónde hay oportunidades de crecimiento.",
    accent: "var(--bp-purple)",
    icon: (
      <path
        d="M12 3v3M12 18v3M3 12h3M18 12h3M6.34 6.34l2.12 2.12M15.54 15.54l2.12 2.12M6.34 17.66l2.12-2.12M15.54 8.46l2.12-2.12M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/mapa-valor-servicios",
    title: "Mapa de Valor de Servicios",
    description:
      "Matriz de trazabilidad BUILD, FutureProof y Agentic: qué promete cada servicio, qué tan comprobado está por proyecto y dónde están las brechas.",
    accent: "var(--bp-cyan)",
    icon: (
      <path
        d="M4 6h16M4 6v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6M4 6l2-3h12l2 3M9 11h6M9 15h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

export default function HomePage() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 py-16"
      style={{ background: "var(--bp-gradient-cover)" }}
    >
      <Logo variant="white" style={{ transform: "scale(1.1)" }} />

      <div className="mt-8 text-center">
        <div className="eyebrow" style={{ color: "var(--bp-cyan)" }}>
          BluePixel Studio
        </div>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Portal interno</h1>
        <p className="mt-2 max-w-md text-[13px] text-white/70">
          Elige un espacio de trabajo para continuar.
        </p>
      </div>

      <div className="mt-10 grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DESTINATIONS.map((d) => (
          <Link
            key={d.href}
            href={d.href}
            className="group flex flex-col gap-3 rounded-[var(--bp-radius-lg)] border border-white/15 bg-white/5 p-6 backdrop-blur-sm transition-all duration-[var(--bp-dur)] hover:-translate-y-1 hover:border-white/30 hover:bg-white/10"
          >
            <span
              className="flex h-11 w-11 items-center justify-center rounded-[var(--bp-radius-md)]"
              style={{ backgroundColor: `${d.accent}26`, color: d.accent }}
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6">
                {d.icon}
              </svg>
            </span>
            <div>
              <h2 className="text-lg font-bold text-white">{d.title}</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-white/65">{d.description}</p>
            </div>
            <span className="mt-1 inline-flex items-center gap-1 text-[13px] font-semibold text-white/85 transition-transform duration-[var(--bp-dur)] group-hover:translate-x-1">
              Entrar
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5">
                <path
                  d="M6 3l5 5-5 5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
