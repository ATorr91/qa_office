"use client";

import { getMonthLabel, getPeriodLabel, type Strategist } from "@/lib/strategists";
import { useDashboardFilters, type Period } from "@/lib/dashboardFilters";
import { getEffectiveRecord, useStrategistRecords } from "@/lib/strategistRecords";

const NO_DATA = "Sin información disponible";

function periodLabel(period: Period): string {
  return getPeriodLabel(period);
}

/** Clean, black-on-white report layout shown only when printing (window.print → PDF). */
export function DashboardPrintableReport({ strategists, period }: { strategists: Strategist[]; period: Period }) {
  const { jiraDeadlines, bitacorasSync } = useDashboardFilters();
  const { recordsByStrategist } = useStrategistRecords();
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
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Dashboard de Estrategas — BluePixel Studio</h1>
        <div style={{ textAlign: "right", fontSize: 11, color: "#555" }}>
          <div>Periodo: {periodLabel(period)}</div>
          <div>Generado el {generatedAt}</div>
          <div>
            {strategists.length} estratega{strategists.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      <p style={{ fontSize: 9.5, color: "#777", marginBottom: 12 }}>
        Todos los datos de este reporte son reales: deadlines vienen de Jira, bitácoras de Google Sheets; el resto se carga
        manualmente en la sección Admin. Un campo sin dato muestra &quot;{NO_DATA}&quot;.
      </p>

      {strategists.map((s, i) => {
        const manualByMonth = recordsByStrategist[s.id] ?? {};
        const deadlinesByMonth = jiraDeadlines?.configured && !jiraDeadlines.error ? jiraDeadlines.byEmail[s.email] ?? null : null;
        const bitacorasByMonth = bitacorasSync?.configured && !bitacorasSync.error ? bitacorasSync.byStrategistId[s.id] ?? null : null;
        const r = getEffectiveRecord(manualByMonth, deadlinesByMonth, period, bitacorasByMonth);
        const deadlineText =
          r.deadlineComplianceRate !== null
            ? `${r.deadlineComplianceRate}% (${r.deadlinesOnTime}/${r.deadlinesAssigned})`
            : jiraDeadlines?.configured
              ? "sin deadlines vencidos en este periodo"
              : "Jira no conectado";

        return (
          <div key={s.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: i === strategists.length - 1 ? "none" : "1px solid #ddd", breakInside: "avoid" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700 }}>
              {s.name} <span style={{ fontWeight: 400, color: "#555" }}>— {s.role}</span>
            </h2>
            <div style={{ fontSize: 11, marginTop: 4, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
              <div>Desempeño: <strong>{r.performanceScore !== null ? `${r.performanceScore}%` : NO_DATA}</strong></div>
              <div>Peer review: <strong>{r.peerReviewScore !== null ? `${r.peerReviewScore}%` : NO_DATA}</strong>{r.peerReviewCount !== null ? ` (${r.peerReviewCount} eval.)` : ""}</div>
              <div>OKR: <strong>{r.okrCompletion !== null ? `${r.okrCompletion}%` : NO_DATA}</strong> · KPI: <strong>{r.kpiCompliance !== null ? `${r.kpiCompliance}%` : NO_DATA}</strong></div>
              <div>Deadlines (Jira): <strong>{deadlineText}</strong></div>
              <div>
                Bitácoras (Sheets): <strong>{r.bitacoraComplianceRate !== null ? `${r.bitacoraComplianceRate}%` : NO_DATA}</strong>
                {r.bitacorasExpected !== null ? ` (${r.bitacorasSubmitted}/${r.bitacorasExpected})` : ""}
              </div>
              <div>Última bitácora: {r.lastBitacoraDate ?? "—"}</div>
              <div>Calificación QA: <strong>{r.qaScore !== null ? `${r.qaScore}%` : NO_DATA}</strong>{r.qaIssuesFound !== null ? ` (${r.qaIssuesFound} hallazgos)` : ""}</div>
              <div>NPS cliente: <strong>{r.npsScore !== null ? r.npsScore : NO_DATA}</strong></div>
            </div>
            {r.okrs.length > 0 && (
              <div style={{ fontSize: 10.5, marginTop: 6 }}>
                <strong>OKRs:</strong>
                <ul style={{ margin: "2px 0 0", paddingLeft: 16 }}>
                  {r.okrs.map((okr, j) => (
                    <li key={j}>
                      {okr.objective} — {okr.keyResult} ({okr.progress}%)
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {r.selfAssessments.length > 0 && (
              <div style={{ fontSize: 10.5, marginTop: 6 }}>
                <strong>Autoevaluación guiada:</strong>
                {r.selfAssessments.map((a) => (
                  <div key={a.month} style={{ marginTop: 2 }}>
                    {r.selfAssessments.length > 1 && <span style={{ color: "#777" }}>{getMonthLabel(a.month)}: </span>}
                    <div>Victoria: {a.biggestWin}</div>
                    <div>Aprendizaje: {a.mistakeLearning}</div>
                    <div>Habilidad a desarrollar: {a.skillToDevelop}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default DashboardPrintableReport;
