import { RING_LABELS, RING_OPTIONS, RING_TIMEFRAME, type Trend } from "@/lib/trends";

/** Clean, black-on-white report layout shown only when printing (window.print → PDF). */
export function TrendsPrintableReport({ trends }: { trends: Trend[] }) {
  const generatedAt = new Date().toLocaleString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="hidden print:block" style={{ color: "#111", fontFamily: "var(--bp-font-body)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "2px solid #111", paddingBottom: 12, marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Radar de Tendencias — BluePixel Studio</h1>
        <div style={{ textAlign: "right", fontSize: 11, color: "#555" }}>
          <div>Generado el {generatedAt}</div>
          <div>{trends.length} tendencia{trends.length === 1 ? "" : "s"}</div>
        </div>
      </div>

      {RING_OPTIONS.map((ring) => {
        const items = trends.filter((t) => t.ring === ring);
        if (items.length === 0) return null;
        return (
          <div key={ring} style={{ marginBottom: 24, breakInside: "avoid" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
              {RING_LABELS[ring]} <span style={{ fontWeight: 400, color: "#555", fontSize: 11 }}>· {RING_TIMEFRAME[ring]}</span>
            </h2>
            {items.map((t, i) => (
              <div key={t.id} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: i === items.length - 1 ? "none" : "1px solid #ddd" }}>
                <h3 style={{ fontSize: 13, fontWeight: 700 }}>
                  {t.pinned ? "★ " : ""}
                  {t.title}
                </h3>
                <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>
                  {t.category}
                  {t.pestle.length > 0 ? ` · PESTLE: ${t.pestle.join(", ")}` : ""} · Relevancia {t.relevance} · Tendencia {t.trending} · Oportunidad {t.opportunity}
                </div>
                <p style={{ fontSize: 11, marginTop: 4, lineHeight: 1.5 }}>{t.summary}</p>
                {t.adopters.length > 0 && (
                  <p style={{ fontSize: 11, marginTop: 4 }}>
                    <strong>Ya lo usan:</strong> {t.adopters.join(", ")}
                  </p>
                )}
                {t.realExamples.length > 0 && (
                  <ul style={{ fontSize: 11, marginTop: 4, paddingLeft: 16 }}>
                    {t.realExamples.map((ex, j) => (
                      <li key={j}>
                        <strong>{ex.org}</strong> — {ex.detail}
                      </li>
                    ))}
                  </ul>
                )}
                {t.impactPotential && (
                  <p style={{ fontSize: 11, marginTop: 4 }}>
                    <strong>Impacto potencial:</strong> {t.impactPotential}
                  </p>
                )}
                <p style={{ fontSize: 10, color: "#555", marginTop: 4 }}>
                  Fuente: {t.source} · detectada el {t.spottedAt}
                </p>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default TrendsPrintableReport;
