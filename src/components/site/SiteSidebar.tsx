"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/brand/Logo";
import { STAGE_STYLE } from "@/components/proceso/procesoUi";
import { isActive, SITE_NAV } from "@/components/site/siteNav";

const linkBase = "group/nav flex items-center gap-2.5 rounded-[var(--bp-radius-md)] px-2.5 py-1.5 text-[13px] font-medium transition-all duration-[var(--bp-dur-fast)] hover:translate-x-0.5";

/** The menu of the whole site: the process (home and its five stages) and the results (dashboard, evaluation, admin). */
export function SiteSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--bp-border)] bg-[var(--bp-surface)] lg:sticky lg:top-0 lg:flex lg:h-screen print:hidden">
      <div className="px-4 pb-2 pt-5">
        <Link href="/" aria-label="Inicio" className="block pl-1">
          <Logo variant="dark" style={{ transform: "scale(0.72)", transformOrigin: "left center" }} />
        </Link>
        <p className="mt-4 text-[14px] font-bold text-[var(--bp-ink)]">Proceso de Estrategas</p>
      </div>

      <nav aria-label="Menú del sitio" className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {SITE_NAV.map((group, gi) => (
          <div key={group.label} className={gi === 0 ? "mt-2" : "mt-5"}>
            <p className="px-2.5 pb-1.5 text-[11px] font-semibold text-[var(--bp-ink-soft)]">{group.label}</p>
            <ul className={`relative flex flex-col gap-0.5 ${group.items.some((i) => i.stage) ? "before:absolute before:bottom-[22px] before:left-[19px] before:top-[58px] before:w-px before:bg-[var(--bp-border)]" : ""}`}>
              {group.items.map((item) => {
                const current = isActive(item, pathname);
                const style = item.stage ? STAGE_STYLE[item.stage] : null;
                return (
                  <li key={item.href} className="relative">
                    <Link href={item.href} aria-current={current ? "page" : undefined} className={`${linkBase} ${current ? "bg-[var(--bp-blue-tint)] text-[var(--bp-ink)]" : "text-[var(--bp-ink-soft)] hover:bg-[var(--bp-surface-alt)] hover:text-[var(--bp-ink)]"}`}>
                      {style && item.number ? (
                        <span
                          aria-hidden
                          className="relative z-10 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-all duration-[var(--bp-dur)] group-hover/nav:scale-110"
                          style={current ? { backgroundColor: style.color, borderColor: style.color, color: style.on } : { backgroundColor: "var(--bp-surface)", borderColor: style.color, color: "var(--bp-ink)" }}
                        >
                          {item.number}
                        </span>
                      ) : (
                        <span aria-hidden className={`h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-[var(--bp-dur)] group-hover/nav:scale-150 ${current ? "bg-[var(--bp-blue)]" : "bg-[var(--bp-border)]"}`} style={{ marginInline: "8px" }} />
                      )}
                      <span className={current ? "font-semibold" : ""}>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-[var(--bp-border)] px-3 py-3 text-[12px]">
        <Link href="/portal" className="block rounded-[var(--bp-radius-md)] px-2.5 py-1.5 font-medium text-[var(--bp-ink-soft)] transition-colors hover:bg-[var(--bp-surface-alt)] hover:text-[var(--bp-ink)]">
          Portal de proyectos
        </Link>
      </div>
    </aside>
  );
}

export default SiteSidebar;
