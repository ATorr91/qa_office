import type { Metadata } from "next";
import SiteMobileBar from "@/components/site/SiteMobileBar";
import SiteSidebar from "@/components/site/SiteSidebar";

export const metadata: Metadata = {
  title: { default: "Proceso de Estrategas · BluePixel", template: "%s · BluePixel" },
  description: "El proceso de estrategas en cinco etapas y el dashboard con sus resultados, en un solo sitio.",
};

/** One site: the menu on the left (process and results) and each page to its right. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bp-surface-alt)] lg:flex">
      <SiteSidebar />
      <div className="min-w-0 flex-1">
        <SiteMobileBar />
        {children}
      </div>
    </div>
  );
}
