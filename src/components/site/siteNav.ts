import type { StageId } from "@/lib/procesoTypes";

export interface SiteNavItem {
  label: string;
  href: string;
  /** Stage number, for the numbered nodes of the process. */
  stage?: StageId;
  number?: number;
  /** The link also counts as active on deeper paths (a profile is part of the dashboard). */
  prefix?: boolean;
}

export interface SiteNavGroup {
  label: string;
  items: SiteNavItem[];
}

export const stageHref = (id: StageId) => `/etapa/${id}`;

export const SITE_NAV: SiteNavGroup[] = [
  {
    label: "Proceso",
    items: [
      { label: "Inicio", href: "/" },
      { label: "Discovery", href: stageHref("discovery"), stage: "discovery", number: 1 },
      { label: "Build", href: stageHref("build"), stage: "build", number: 2 },
      { label: "Testing", href: stageHref("testing"), stage: "testing", number: 3 },
      { label: "Entrega", href: stageHref("entrega"), stage: "entrega", number: 4 },
      { label: "FutureProof", href: stageHref("futureproof"), stage: "futureproof", number: 5 },
    ],
  },
  {
    label: "Resultados",
    items: [
      { label: "Dashboard", href: "/dashboard-estrategas" },
      { label: "Cerebro", href: "/dashboard-estrategas/cerebro" },
      { label: "Admin", href: "/dashboard-estrategas/admin", prefix: true },
    ],
  },
];

/** Dashboard stays active on a person's profile too; the other items match their own path. */
export function isActive(item: SiteNavItem, pathname: string): boolean {
  if (item.href === "/dashboard-estrategas") return pathname === item.href || pathname.startsWith("/dashboard-estrategas/perfil");
  return item.prefix ? pathname.startsWith(item.href) : pathname === item.href;
}
