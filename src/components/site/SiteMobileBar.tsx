"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/brand/Logo";
import { STAGE_STYLE } from "@/components/proceso/procesoUi";
import { isActive, SITE_NAV } from "@/components/site/siteNav";

/** Small screens have no sidebar: a bar with the logo and the same links in one scrollable row. */
export function SiteMobileBar() {
  const pathname = usePathname();
  const items = SITE_NAV.flatMap((g) => g.items);
  return (
    <header className="border-b border-[var(--bp-border)] bg-[var(--bp-surface)] lg:hidden print:hidden">
      <div className="flex items-center px-5 py-2.5 md:px-8">
        <Link href="/" aria-label="Inicio">
          <Logo variant="dark" style={{ transform: "scale(0.65)", transformOrigin: "left center" }} />
        </Link>
      </div>
      <nav aria-label="Menú del sitio" className="px-3 md:px-6">
        <ul className="flex flex-nowrap gap-0.5 overflow-x-auto">
          {items.map((item) => {
            const current = isActive(item, pathname);
            return (
              <li key={item.href} className="shrink-0">
                <Link href={item.href} aria-current={current ? "page" : undefined} className={`relative flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-[12px] font-semibold transition-colors duration-[var(--bp-dur-fast)] ${current ? "text-[var(--bp-blue-600)]" : "text-[var(--bp-ink-soft)] hover:text-[var(--bp-ink)]"}`}>
                  {item.stage && <span aria-hidden className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: STAGE_STYLE[item.stage].color }} />}
                  {item.label}
                  {current && <span aria-hidden className="bp-underline absolute inset-x-3 bottom-0 h-0.5 bg-[var(--bp-blue)]" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}

export default SiteMobileBar;
