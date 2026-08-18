export function UnderConstruction({ title }: { title: string }) {
  return (
    <div className="bp-anim-page flex flex-col items-center justify-center gap-4 rounded-[var(--bp-radius-lg)] border border-dashed border-[var(--bp-border)] bg-[var(--bp-surface)] px-6 py-24 text-center">
      <div className="bp-anim-pop flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bp-blue-tint)]">
        <svg viewBox="0 0 24 24" className="h-7 w-7 text-[var(--bp-blue)]">
          <path
            d="M3 21h18M5 21V8l4-4h6l4 4v13M9 21v-6h6v6M9 11h.01M15 11h.01M12 11h.01"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div>
        <div className="eyebrow">{title}</div>
        <h1 className="mt-2 text-xl font-bold text-[var(--bp-ink)]">Sitio en construcción</h1>
        <p className="mt-2 max-w-sm text-[13px] text-[var(--bp-ink-soft)]">
          Esta sección está en desarrollo. Muy pronto podrás usarla desde aquí.
        </p>
      </div>
    </div>
  );
}

export default UnderConstruction;
