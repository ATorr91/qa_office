"use client";

// One tooltip for the whole app. Any element with `data-tip="text"` gets it: on hover after a short pause, and on keyboard focus.
// It lives in a fixed layer above everything, so it is never clipped by a table or a scrolling panel, flips below when there is
// no room above, and stays inside the screen. Touch screens skip it (there is no hover); the visible label or aria-label still says it.
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const SHOW_DELAY = 280;
/** Moving from one tip to the next within this window shows the next one at once. */
const WARM_MS = 450;
const GAP = 9;
const EDGE = 8;

interface Tip {
  text: string;
  target: HTMLElement;
}

export default function TooltipHost() {
  const [tip, setTip] = useState<Tip | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const timer = useRef(0);
  const shown = useRef<HTMLElement | null>(null);
  const hiddenAt = useRef(0);

  useEffect(() => {
    const find = (t: EventTarget | null) => (t instanceof Element ? t.closest<HTMLElement>("[data-tip]") : null);

    const hide = () => {
      window.clearTimeout(timer.current);
      if (shown.current) {
        shown.current.removeAttribute("aria-describedby");
        shown.current = null;
        hiddenAt.current = performance.now();
      }
      setTip(null);
    };

    const show = (el: HTMLElement, delay: number) => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        const text = el.getAttribute("data-tip");
        if (!text || !el.isConnected) return;
        if (shown.current && shown.current !== el) shown.current.removeAttribute("aria-describedby");
        shown.current = el;
        el.setAttribute("aria-describedby", "bp-tooltip");
        setTip({ text, target: el });
      }, delay);
    };

    const onOver = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const el = find(e.target);
      if (!el || el === shown.current) return;
      show(el, performance.now() - hiddenAt.current < WARM_MS || shown.current ? 0 : SHOW_DELAY);
    };
    const onOut = (e: PointerEvent) => {
      const el = find(e.target);
      if (!el) return;
      if (e.relatedTarget instanceof Node && el.contains(e.relatedTarget)) return;
      hide();
    };
    const onFocusIn = (e: FocusEvent) => {
      const el = find(e.target);
      if (el?.matches(":focus-visible")) show(el, 0);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };

    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", hide);
    document.addEventListener("pointerdown", hide);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      window.clearTimeout(timer.current);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", hide);
      document.removeEventListener("pointerdown", hide);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, []);

  // Place the bubble before it is painted: measured, flipped if needed and clamped to the screen. Done on the DOM, no extra render.
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const bubble = bubbleRef.current;
    if (!tip || !wrap || !bubble) return;
    const r = tip.target.getBoundingClientRect();
    const w = bubble.offsetWidth;
    const h = bubble.offsetHeight;
    const place = r.top - h - GAP >= EDGE ? "top" : "bottom";
    const center = r.left + r.width / 2;
    const x = Math.min(Math.max(center - w / 2, EDGE), Math.max(EDGE, window.innerWidth - w - EDGE));
    const y = place === "top" ? r.top - h - GAP : r.bottom + GAP;
    wrap.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    wrap.style.visibility = "visible";
    bubble.dataset.place = place;
    bubble.style.setProperty("--arrow-x", `${Math.round(Math.min(Math.max(center - x, 12), w - 12))}px`);
  }, [tip]);

  if (!tip) return null;
  return (
    <div ref={wrapRef} className="pointer-events-none fixed left-0 top-0 z-[100]" style={{ visibility: "hidden" }}>
      <div ref={bubbleRef} key={`${tip.text}`} id="bp-tooltip" role="tooltip" className="bp-tip">
        {tip.text}
        <span aria-hidden className="bp-tip-arrow" />
      </div>
    </div>
  );
}
