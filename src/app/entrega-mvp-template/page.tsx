"use client";

import Link from "next/link";

// The deck lives in public/entrega-mvp-template/ as a self-contained static site; it's embedded in an
// iframe so its styles and keyboard shortcuts stay isolated from the portal.
export default function EntregaMvpTemplatePage() {
  return (
    <div className="relative min-h-screen">
      <Link
        href="/"
        className="fixed right-4 top-3 z-10 rounded-full bg-black/40 px-3 py-1.5 text-[12px] font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/60"
      >
        ← Volver al portal
      </Link>
      <iframe
        src="/entrega-mvp-template/index.html"
        title="Entrega del MVP · Template"
        className="block h-screen w-full border-0"
        // The deck starts with "press any key": give the iframe focus so keys reach it right away.
        onLoad={(e) => e.currentTarget.contentWindow?.focus()}
        allow="fullscreen"
      />
    </div>
  );
}
