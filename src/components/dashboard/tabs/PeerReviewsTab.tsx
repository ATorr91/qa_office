"use client";

import BarList from "@/components/dashboard/BarList";
import DonutChart from "@/components/dashboard/DonutChart";
import InsightPanel from "@/components/dashboard/InsightPanel";
import StatTile from "@/components/dashboard/StatTile";
import StrategistAvatar from "@/components/dashboard/StrategistAvatar";
import { useEffectiveRecords } from "@/lib/strategistRecords";

const LOW_SCORE_THRESHOLD = 65;
// A period with no peer review is "NA": it is shown as such and never counted in the evaluation.
const NO_DATA_LABEL = "NA";

function toneFor(score: number): "good" | "warning" | "danger" {
  if (score >= 80) return "good";
  if (score >= LOW_SCORE_THRESHOLD) return "warning";
  return "danger";
}

export function PeerReviewsTab() {
  const rows = useEffectiveRecords();
  const withData = rows.filter((x) => x.r.peerReviewScore !== null).sort((a, b) => b.r.peerReviewScore! - a.r.peerReviewScore!);

  const teamAvg = withData.length > 0 ? Math.round(withData.reduce((acc, x) => acc + x.r.peerReviewScore!, 0) / withData.length) : null;
  const totalReviews = rows.reduce((acc, x) => acc + (x.r.peerReviewCount ?? 0), 0);
  const lowScore = withData.filter((x) => x.r.peerReviewScore! < LOW_SCORE_THRESHOLD);

  const allComments = rows.flatMap((x) => x.r.peerComments.map((c) => ({ ...c, strategist: x.s.name })));
  const positivos = allComments.filter((c) => c.sentiment === "positivo").length;
  const constructivos = allComments.filter((c) => c.sentiment === "constructivo").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          label="Peer review promedio"
          value={teamAvg !== null ? `${teamAvg}%` : NO_DATA_LABEL}
          tone={teamAvg !== null ? toneFor(teamAvg) : "neutral"}
          sublabel={teamAvg === null ? "Sin peer review en el periodo: no cuenta en el desempeño" : undefined}
        />
        <StatTile label="Evaluaciones recibidas" value={String(totalReviews)} sublabel="En el periodo seleccionado" />
        <StatTile
          label="Estrategas con score bajo"
          value={String(lowScore.length)}
          sublabel={`Score < ${LOW_SCORE_THRESHOLD}%`}
          tone={lowScore.length > 0 ? "danger" : "good"}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
          <h3 className="text-[13px] font-semibold text-[var(--bp-ink)]">Tono de los comentarios</h3>
          <p className="mt-0.5 text-[11px] text-[var(--bp-ink-soft)]">Distribución de comentarios de peer review del periodo.</p>
          <div className="mt-3">
            {positivos + constructivos === 0 ? (
              <p className="text-[12px] text-[var(--bp-ink-soft)]">{NO_DATA_LABEL}: no hay peer review en este periodo.</p>
            ) : (
              <DonutChart
                segments={[
                  { label: "Positivos", value: positivos, color: "var(--bp-green)" },
                  { label: "Constructivos", value: constructivos, color: "#b8860b" },
                ]}
                centerValue={String(positivos + constructivos)}
                centerLabel="comentarios"
              />
            )}
          </div>
        </div>
        <div className="rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
          <h3 className="text-[13px] font-semibold text-[var(--bp-ink)]">Ranking por peer review</h3>
          <p className="mt-0.5 text-[11px] text-[var(--bp-ink-soft)]">Score promedio recibido de pares en el periodo.</p>
          <div className="mt-3">
            {withData.length === 0 ? (
              <p className="text-[12px] text-[var(--bp-ink-soft)]">{NO_DATA_LABEL}: no hay peer review en este periodo.</p>
            ) : (
              <BarList items={withData.map((x) => ({ label: x.s.name, value: x.r.peerReviewScore!, tone: toneFor(x.r.peerReviewScore!) }))} />
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[var(--bp-radius-md)] border border-[var(--bp-border)]">
        <table className="w-full min-w-[520px] border-collapse text-left text-[12px]">
          <thead>
            <tr className="border-b border-[var(--bp-border)] bg-[var(--bp-surface-alt)] text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
              <th className="px-3 py-2">Estratega</th>
              <th className="px-3 py-2 text-right">Peer review</th>
              <th className="px-3 py-2 text-right">Evaluaciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-[12px] text-[var(--bp-ink-soft)]">
                  Aún no hay estrategas para este filtro.
                </td>
              </tr>
            ) : (
              rows.map(({ s, r }, i) => (
                <tr key={s.id} className="bp-row-in border-b border-[var(--bp-border)] last:border-0" style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}>
                  <td className="px-3 py-2.5">
                    <StrategistAvatar strategist={s} />
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    {r.peerReviewScore !== null ? `${r.peerReviewScore}%` : <span className="text-[11px] text-[var(--bp-ink-soft)]">{NO_DATA_LABEL}</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">{r.peerReviewCount ?? NO_DATA_LABEL}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <InsightPanel
        alerts={lowScore.map((x) => ({ text: `${x.s.name} recibió ${x.r.peerReviewScore}% de sus pares — por debajo de ${LOW_SCORE_THRESHOLD}%.` }))}
        comments={allComments.slice(0, 6).map((c) => ({ author: `${c.strategist} · ${c.from}`, text: c.comment }))}
      />
    </div>
  );
}

export default PeerReviewsTab;
