import Logo from "@/components/brand/Logo";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/" },
  { label: "Reportes", href: "/reportes" },
  { label: "Proyectos", href: "/proyectos" },
  { label: "Métricas", href: "/metricas" },
];

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--bp-border)] bg-[var(--bp-surface)] px-5 py-6 md:flex">
      <Logo variant="dark" style={{ transform: "scale(0.85)", transformOrigin: "left center" }} />
      <nav className="mt-10 flex flex-col gap-1">
        {NAV_ITEMS.map((item, i) => (
          <a
            key={item.href}
            href={item.href}
            className={`rounded-[var(--bp-radius-md)] px-3 py-2 text-sm font-medium transition-colors duration-[var(--bp-dur)] ${
              i === 0
                ? "bg-[var(--bp-blue-tint)] text-[var(--bp-blue-600)]"
                : "text-[var(--bp-ink-soft)] hover:bg-[var(--bp-surface-alt)]"
            }`}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
