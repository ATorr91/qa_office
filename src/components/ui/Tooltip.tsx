"use client";

export function Tooltip({ label, text }: { label?: string; text: string }) {
  return (
    <span className="group relative inline-flex items-center">
      <button
        type="button"
        aria-label={label ?? "Ayuda"}
        className="bp-tap flex h-4 w-4 items-center justify-center rounded-full border border-[var(--bp-border)] text-[9px] font-bold text-[var(--bp-ink-soft)] outline-none transition-all duration-[var(--bp-dur)] hover:scale-110 hover:border-[var(--bp-blue)] hover:text-[var(--bp-blue)] focus-visible:border-[var(--bp-blue)] focus-visible:text-[var(--bp-blue)]"
      >
        ?
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 scale-95 rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-ink)] px-2.5 py-2 text-[11px] leading-relaxed text-white opacity-0 shadow-[var(--bp-shadow-md)] transition-all duration-[var(--bp-dur)] group-hover:scale-100 group-hover:opacity-100 group-focus-within:scale-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

export default Tooltip;
