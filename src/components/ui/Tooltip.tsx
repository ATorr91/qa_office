"use client";

/** The small "?" help button. It only carries the text: the shared TooltipHost draws it (see TooltipHost.tsx). */
export function Tooltip({ label, text }: { label?: string; text: string }) {
  return (
    <button
      type="button"
      aria-label={label ?? "Ayuda"}
      data-tip={text}
      className="bp-tap flex h-4 w-4 items-center justify-center rounded-full border border-[var(--bp-border)] text-[9px] font-bold text-[var(--bp-ink-soft)] outline-none transition-all duration-[var(--bp-dur)] hover:scale-110 hover:border-[var(--bp-blue)] hover:text-[var(--bp-blue)] focus-visible:border-[var(--bp-blue)] focus-visible:text-[var(--bp-blue)]"
    >
      ?
    </button>
  );
}

export default Tooltip;
