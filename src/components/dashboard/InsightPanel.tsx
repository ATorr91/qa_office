export interface AlertItem {
  text: string;
  severity?: "warning" | "danger";
}

export interface CommentItem {
  author: string;
  text: string;
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0">
      <path
        d="M8 1.5l7 12.5H1L8 1.5ZM8 6v3.5M8 11.5v.01"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TipIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0">
      <path
        d="M8 1.5a4.5 4.5 0 0 0-2.5 8.25c.3.2.5.55.5.95V11h4v-.3c0-.4.2-.75.5-.95A4.5 4.5 0 0 0 8 1.5ZM6.5 13.5h3M7 15h2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function InsightPanel({
  alerts = [],
  tips = [],
  comments = [],
}: {
  alerts?: AlertItem[];
  tips?: string[];
  comments?: CommentItem[];
}) {
  if (alerts.length === 0 && tips.length === 0 && comments.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {alerts.length > 0 && (
        <div className="rounded-[var(--bp-radius-md)] border border-[var(--bp-danger)]/30 bg-[var(--bp-danger)]/5 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-danger)]">
            <AlertIcon />
            Alertas
          </div>
          <ul className="mt-2 flex flex-col gap-1.5 text-[12px] leading-relaxed text-[var(--bp-ink)]">
            {alerts.map((a, i) => (
              <li key={i}>{a.text}</li>
            ))}
          </ul>
        </div>
      )}

      {tips.length > 0 && (
        <div className="rounded-[var(--bp-radius-md)] border border-[var(--bp-blue)]/30 bg-[var(--bp-blue)]/5 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-blue-600)]">
            <TipIcon />
            Tips
          </div>
          <ul className="mt-2 flex flex-col gap-1.5 text-[12px] leading-relaxed text-[var(--bp-ink)]">
            {tips.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      {comments.length > 0 && (
        <div className="rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
            Comentarios recientes
          </div>
          <ul className="mt-2 flex flex-col gap-2 text-[12px] leading-relaxed text-[var(--bp-ink)]">
            {comments.map((c, i) => (
              <li key={i}>
                <span className="font-semibold">{c.author}:</span> {c.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default InsightPanel;
