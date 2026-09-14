"use client";

import { useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { Expand, X } from "lucide-react";
import PaperTexture from "./PaperTexture";

gsap.registerPlugin(useGSAP);

export default function LabHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const overlayImageRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);

  useGSAP(
    () => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(".lab-headline", { opacity: 0, y: 24, duration: 0.8 })
        .from(".lab-cta", { opacity: 0, y: 12, duration: 0.6 }, "-=0.4");
    },
    { scope: sectionRef }
  );

  useGSAP(
    () => {
      const overlay = overlayRef.current;
      const image = overlayImageRef.current;
      if (!overlay || !image) return;

      if (expanded) {
        overlay.style.pointerEvents = "auto";
        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.5 })
          .fromTo(image, { scale: 1.35 }, { scale: 1, duration: 1.3, ease: "power4.out" }, "-=0.4");
      } else {
        gsap.to(overlay, {
          opacity: 0,
          duration: 0.4,
          ease: "power2.out",
          onComplete: () => {
            overlay.style.pointerEvents = "none";
          },
        });
      }
    },
    { dependencies: [expanded], scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen font-jakarta flex flex-col items-center justify-center text-center px-6 overflow-hidden"
      style={{ backgroundColor: "#E8D7BC" }}
    >
      <PaperTexture />

      <h1
        className="lab-headline relative font-orbitron font-extrabold uppercase max-w-4xl"
        style={{
          letterSpacing: "0.05em",
          lineHeight: 1.05,
          fontSize: "clamp(1.5rem, 3vw + 0.5rem, 3.6rem)",
          color: "#2b2016",
        }}
      >
        TELL ME WHAT
        <br />
        GOES HERE
      </h1>

      <div className="lab-cta relative mt-8">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="group inline-flex items-center rounded-full border uppercase font-semibold transition-colors text-[#2b2016] hover:bg-[#2b2016] hover:text-[#E8D7BC]"
          style={{
            letterSpacing: "0.18em",
            fontSize: "var(--body)",
            paddingInline: "var(--btn-px)",
            paddingBlock: "var(--btn-py)",
            gap: "var(--btn-gap)",
            borderColor: "rgba(60,42,20,0.35)",
          }}
        >
          Ver el lobby
          <Expand
            size={16}
            className="transition-transform group-hover:scale-110"
          />
        </button>
      </div>

      <div
        ref={overlayRef}
        className="fixed inset-0 z-[100] overflow-hidden"
        style={{ opacity: 0, pointerEvents: "none" }}
      >
        <div
          ref={overlayImageRef}
          className="absolute inset-0"
          style={{
            backgroundImage: "url(/capacitacion/fondo.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <button
          type="button"
          onClick={() => setExpanded(false)}
          aria-label="Cerrar"
          className="absolute flex items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
          style={{ top: 24, right: 24, width: 44, height: 44 }}
        >
          <X size={20} />
        </button>
      </div>
    </section>
  );
}
