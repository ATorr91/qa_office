"use client";

import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import FashionModel3D from "./FashionModel3D";
import CornerBracket from "./CornerBracket";
import Checkerboard from "./Checkerboard";
import WireframeGlobe from "./WireframeGlobe";

gsap.registerPlugin(useGSAP, DrawSVGPlugin);

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const modelHostRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const featureRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.set(".corner-bracket-path, .globe-draw", { drawSVG: "0%" });
      gsap.set(".checker-square", { scale: 0 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(modelHostRef.current, { opacity: 0, scale: 0.94, duration: 1.2, ease: "power2.out" })
        .from(".headline-line", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
      })
        .to(
          ".corner-bracket-path",
          { drawSVG: "100%", duration: 0.6, stagger: 0.05, ease: "power2.inOut" },
          "-=0.5"
        )
        .to(
          ".checker-square",
          { scale: 1, duration: 0.4, stagger: { each: 0.02, from: "random" }, ease: "back.out(1.7)" },
          "-=0.3"
        )
        .from(ctaRef.current, { y: 16, opacity: 0, duration: 0.6 }, "-=0.2")
        .from(featureRef.current, { y: 16, opacity: 0, duration: 0.6 }, "-=0.4")
        .to(".globe-draw", { drawSVG: "100%", duration: 0.8, stagger: 0.05, ease: "power2.inOut" }, "-=0.3")
        .from(".tagline-line", { opacity: 0, y: 8, duration: 0.5, stagger: 0.08 }, "-=0.4")
        .call(() => {
          gsap.to(".globe-svg", {
            rotate: 360,
            duration: 40,
            repeat: -1,
            ease: "none",
            transformOrigin: "50% 50%",
          });
        });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="min-h-screen bg-white text-black font-jakarta flex flex-col justify-between relative overflow-hidden selection:bg-black selection:text-white"
    >
      <div ref={modelHostRef} className="absolute inset-0 z-0">
        <FashionModel3D />
      </div>

      <main
        className="relative z-10 flex-1 flex flex-col lg:flex-row lg:justify-between"
        style={{
          paddingInline: "var(--pad-x)",
          paddingBlock: "var(--main-py)",
        }}
      >
        <div className="flex flex-col justify-center">
          <CornerBracket position="tl" className="mb-3 text-black" />

          <h1
            className="font-orbitron font-extrabold uppercase text-black"
            style={{
              letterSpacing: "0.08em",
              lineHeight: 1.05,
              fontSize: "var(--headline)",
            }}
          >
            <span className="headline-line block">FUTURE</span>
            <span className="headline-line block">FORWARD</span>
            <span className="headline-line block">
              FASHION <Checkerboard className="inline-block align-middle" />
            </span>
          </h1>

          <CornerBracket position="bl" className="mt-3 text-black" />

          <div ref={ctaRef} className="mt-8">
            <button
              className="group inline-flex items-center rounded-md border border-gray-400 uppercase font-jakarta font-semibold text-black transition-colors hover:bg-black hover:text-white hover:border-black"
              style={{
                letterSpacing: "0.18em",
                fontSize: "var(--body)",
                paddingInline: "var(--btn-px)",
                paddingBlock: "var(--btn-py)",
                gap: "var(--btn-gap)",
              }}
            >
              SHOP NOW
              <ArrowUpRight
                style={{ width: "var(--icon)", height: "var(--icon)" }}
                className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </button>
          </div>
        </div>

        <div
          ref={featureRef}
          className="relative self-end mt-12 lg:mt-0"
          style={{
            minWidth: "var(--feature-min)",
            padding: "var(--feature-pad)",
          }}
        >
          <CornerBracket position="tl" className="absolute top-0 left-0 text-black" />
          <CornerBracket position="tr" className="absolute top-0 right-0 text-black" />
          <CornerBracket position="bl" className="absolute bottom-0 left-0 text-black" />
          <CornerBracket position="br" className="absolute bottom-0 right-0 text-black" />

          <WireframeGlobe className="text-black" />

          <p
            className="font-jakarta font-semibold uppercase text-black mt-4"
            style={{ letterSpacing: "0.18em", fontSize: "var(--body)" }}
          >
            <span className="tagline-line block">BEYOND TRENDS.</span>
            <span className="tagline-line block">BUILT FOR TOMORROW.</span>
          </p>
        </div>
      </main>
    </section>
  );
}
