"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import SunglassesShowcase from "./SunglassesShowcase";

gsap.registerPlugin(useGSAP);

export default function SunglassesHero() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(".shades-eyebrow", { opacity: 0, y: 12, duration: 0.6 })
        .from(".shades-headline", { opacity: 0, y: 24, duration: 0.8 }, "-=0.3")
        .from(".shades-copy", { opacity: 0, y: 12, duration: 0.6 }, "-=0.4");
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen bg-black font-jakarta flex flex-col items-center justify-center text-center px-6 overflow-hidden"
    >
      <SunglassesShowcase />

      <p
        className="shades-eyebrow relative z-10 text-gray-500 uppercase font-semibold"
        style={{ letterSpacing: "0.3em", fontSize: "var(--micro)" }}
      >
        HERO 03 — DRAFT
      </p>

      <h1
        className="shades-headline relative z-10 font-orbitron font-extrabold uppercase mt-6 max-w-4xl text-white"
        style={{
          letterSpacing: "0.05em",
          lineHeight: 1.05,
          fontSize: "var(--headline)",
        }}
      >
        VISION,
        <br />
        ELEVATED
      </h1>

      <p
        className="shades-copy relative z-10 text-gray-400 mt-6 max-w-md"
        style={{ fontSize: "var(--body)" }}
      >
        A gold-framed aviator that turns to face your cursor, with light
        sliding across the lens as you move. Give me the real headline and
        direction whenever you&apos;re ready.
      </p>
    </section>
  );
}
