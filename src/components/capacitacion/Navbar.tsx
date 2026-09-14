"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { label: "HOME", href: "/capacitacion" },
  { label: "LAB", href: "/capacitacion/lab" },
  { label: "ABOUT", href: "/capacitacion/about" },
  { label: "STUDIO", href: "/capacitacion/studio" },
  { label: "CONTACT", href: "/capacitacion/contact" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header
      className="w-full flex items-center justify-between mix-blend-difference text-white"
      style={{
        paddingInline: "var(--pad-x)",
        paddingTop: "var(--header-pt)",
        paddingBottom: "var(--section-gap)",
      }}
    >
      <Link
        href="/capacitacion"
        className="font-orbitron font-black hover:opacity-80"
        style={{ letterSpacing: "0.15em", fontSize: "var(--logo)" }}
      >
        LGPSM
        <span
          className="-mt-0.5 ml-0.5 align-top"
          style={{ fontSize: "var(--logo-deg)" }}
        >
          ˚
        </span>
      </Link>

      <nav
        className="font-jakarta font-medium uppercase flex items-center"
        style={{
          letterSpacing: "0.2em",
          fontSize: "var(--nav)",
          gap: "var(--gap-nav)",
        }}
      >
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="transition-opacity hover:opacity-50"
              style={{ opacity: active ? 1 : 0.65 }}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
