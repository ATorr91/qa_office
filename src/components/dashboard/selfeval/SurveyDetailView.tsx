"use client";

import { useCallback, useEffect, useState } from "react";
import Badge, { type BadgeColor } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useDashboardFilters } from "@/lib/dashboardFilters";
import { getEffectiveRecordForMonth, useStrategistRecords, type EffectiveRecord } from "@/lib/strategistRecords";
import {
  DIMENSION_LABELS,
  INVITE_STATUS_LABEL,
  ratingToPercent,
  SURVEY_STATUS_LABEL,
  type Dimension,
  type InviteStatus,
  type SurveyAction,
  type SurveyDetail,
  type SurveyStatus,
} from "@/lib/selfEvalTypes";
import { getMonthLabel, STRATEGISTS } from "@/lib/strategists";

export const STATUS_BADGE: Record<SurveyStatus, BadgeColor> = { scheduled: "info", open: "success", closed: "neutral", cancelled: "danger" };
const INVITE_BADGE: Record<InviteStatus, BadgeColor> = { pending: "neutral", sent: "info", answered: "success", expired: "danger" };
const EVENT_LABEL: Record<string, string> = {
  created: "Creada",
  invitation: "Invitación",
  reminder: "Recordatorio",
  answered: "Respondió",
  updated: "Corrigió su respuesta",
  expired: "Sin respuesta",
  closed: "Cerrada",
  extended: "Plazo extendido",
  cancelled: "Cancelada",
  repeat: "Repetición mensual",
};
const nameOf = (id: string | null) => (id ? STRATEGISTS.find((s) => s.id === id)?.name ?? id : "Sistema");

export function formatDateTime(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString("es-MX", { timeZone: "America/Mexico_City", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "—";
}

/** The real number a rating question is compared against, for the same month. */
function actualFor(dimension: Dimension, r: EffectiveRecord): number | null {
  switch (dimension) {
    case "deadlines":
      return r.deadlineComplianceRate;
    case "bitacoras":
      return r.bitacoraComplianceRate;
    case "qa":
      return r.qaScore;
    case "peer":
      return r.peerReviewScore;
    case "okr":
      return r.okrCompletion;
    case "csat":
      return r.csatScore;
    case "overall":
      return r.performanceScore;
  }
}

const GAP_TOLERANCE = 10;

function GapCell({ self, actual }: { self: number | null; actual: number | null }) {
  if (self === null) return <span className="text-[var(--bp-ink-soft)]">—</span>;
  if (actual === null) return <span className="font-mono">{self}% <span className="text-[10px] text-[var(--bp-ink-soft)]">sin dato real</span></span>;
  const gap = self - actual;
  const color = Math.abs(gap) <= GAP_TOLERANCE ? "var(--bp-green)" : gap > 0 ? "#b8860b" : "var(--bp-blue-600)";
  return (
    <span className="font-mono">
      {self}% <span className="text-[var(--bp-ink-soft)]">vs {actual}%</span>{" "}
      <strong style={{ color }}>{gap > 0 ? "+" : ""}{gap}</strong>
    </span>
  );
}

/** One survey in full: who got it and when, who answered, what they said against the real numbers, and the history. */
export function SurveyDetailView({ id, onChanged, onClose }: { id: string; onChanged: () => void; onClose: () => void }) {
  const [detail, setDetail] = useState<SurveyDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const { recordsByStrategist } = useStrategistRecords();
  const { jiraDeadlines, bitacorasSync, externalScores } = useDashboardFilters();

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/self-eval/${id}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "No se pudo cargar la encuesta.");
      else {
        setDetail(json as SurveyDetail);
        setError(null);
      }
    } catch {
      setError("No se pudo conectar con el servidor.");
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function act(action: SurveyAction, strategistId?: string, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/self-eval/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, strategistId }) });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "No se pudo completar la acción.");
      await load();
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function copyLink(token: string) {
    const url = `${window.location.origin}/autoevaluacion/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(token);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      window.prompt("Copia el enlace:", url);
    }
  }

  if (!detail) return <div className="rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4 text-[12px] text-[var(--bp-ink-soft)]">{error ?? "Cargando…"}</div>;

  const { survey, invites, responses, events } = detail;
  const ratings = survey.questions.filter((q) => q.type === "rating");
  const texts = survey.questions.filter((q) => q.type === "text");
  const answeredIds = invites.filter((i) => responses[i.strategistId]).map((i) => i.strategistId);
  const records = Object.fromEntries(
    answeredIds.map((sid) => {
      const s = STRATEGISTS.find((x) => x.id === sid)!;
      return [sid, getEffectiveRecordForMonth(s, survey.period, recordsByStrategist, jiraDeadlines, bitacorasSync, externalScores)];
    }),
  );
  const pct = survey.invited > 0 ? Math.round((survey.answered / survey.invited) * 100) : 0;
  const pendingCount = invites.filter((i) => i.status === "sent" || i.status === "pending").length;

  return (
    <div className="flex flex-col gap-4 rounded-[var(--bp-radius-lg)] border border-[var(--bp-blue)]/40 bg-[var(--bp-surface)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[14px] font-semibold text-[var(--bp-ink)]">{survey.title}</h3>
            <Badge color={STATUS_BADGE[survey.status]}>{SURVEY_STATUS_LABEL[survey.status]}</Badge>
          </div>
          <p className="mt-0.5 text-[11px] text-[var(--bp-ink-soft)]">
            Evalúa {getMonthLabel(survey.period)} · plazo {survey.windowHours} h · recordatorios a las {survey.reminderHours.length ? survey.reminderHours.map((h) => `${h} h`).join(" y ") : "—"} antes
            {survey.repeatMonthly && " · se repite cada mes"} · {survey.status === "scheduled" ? `se envía ${formatDateTime(survey.sendAt)}` : `enviada ${formatDateTime(survey.sentAt)} · cierra ${formatDateTime(survey.closesAt)}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {survey.status === "scheduled" && (
            <Button kind="primary" size="sm" disabled={busy} onClick={() => act("send-now", undefined, "¿Enviar la encuesta ahora?")}>
              Enviar ahora
            </Button>
          )}
          {survey.status === "open" && (
            <>
              <Button kind="outline" size="sm" disabled={busy || pendingCount === 0} onClick={() => act("remind")}>
                Recordar a pendientes ({pendingCount})
              </Button>
              <Button kind="outline" size="sm" disabled={busy} onClick={() => act("close", undefined, "¿Cerrar la encuesta ahora? Quien no respondió quedará sin respuesta.")}>
                Cerrar ahora
              </Button>
            </>
          )}
          {(survey.status === "open" || survey.status === "closed") && (
            <Button kind="outline" size="sm" disabled={busy} onClick={() => act("extend", undefined, `¿Extender el plazo ${survey.windowHours} h más? Quien quedó sin respuesta podrá responder otra vez.`)}>
              Extender {survey.windowHours} h
            </Button>
          )}
          {(survey.status === "scheduled" || survey.status === "open") && (
            <Button kind="ghost" size="sm" disabled={busy} onClick={() => act("cancel", undefined, "¿Cancelar esta encuesta?")}>
              Cancelar
            </Button>
          )}
          <Button kind="ghost" size="sm" onClick={onClose}>
            Cerrar detalle
          </Button>
        </div>
      </div>
      {error && <p role="alert" className="text-[12px] font-medium text-[var(--bp-danger)]">{error}</p>}

      <div>
        <div className="mb-1 flex items-center justify-between text-[12px]">
          <span className="font-semibold text-[var(--bp-ink)]">Participación</span>
          <span className="font-mono text-[var(--bp-ink-soft)]">{survey.answered} de {survey.invited} ({pct}%)</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bp-surface-alt)]">
          <div className="h-full rounded-full bg-[var(--bp-green)] transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-[var(--bp-radius-md)] border border-[var(--bp-border)]">
        <table className="w-full min-w-[640px] border-collapse text-left text-[12px]">
          <thead>
            <tr className="border-b border-[var(--bp-border)] bg-[var(--bp-surface-alt)] text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
              <th className="px-3 py-2">Estratega</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Enviada</th>
              <th className="px-3 py-2 text-right">Recordatorios</th>
              <th className="px-3 py-2">Respondió</th>
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {invites.map((i) => (
              <tr key={i.strategistId} className="border-b border-[var(--bp-border)] last:border-0">
                <td className="px-3 py-2">
                  <div className="font-medium text-[var(--bp-ink)]">{nameOf(i.strategistId)}</div>
                  <div className="text-[11px] text-[var(--bp-ink-soft)]">{i.email}</div>
                </td>
                <td className="px-3 py-2"><Badge color={INVITE_BADGE[i.status]}>{INVITE_STATUS_LABEL[i.status]}</Badge></td>
                <td className="px-3 py-2 text-[var(--bp-ink-soft)]">{formatDateTime(i.sentAt)}</td>
                <td className="px-3 py-2 text-right font-mono">{i.remindersSent}</td>
                <td className="px-3 py-2 text-[var(--bp-ink-soft)]">{formatDateTime(i.answeredAt)}</td>
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button kind="outline" size="sm" onClick={() => copyLink(i.token)}>{copied === i.token ? "Copiado ✓" : "Copiar enlace"}</Button>
                    {survey.status === "open" && i.status !== "answered" && (
                      <Button kind="outline" size="sm" disabled={busy} onClick={() => act("resend", i.strategistId)}>Reenviar</Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h4 className="text-[13px] font-semibold text-[var(--bp-ink)]">Percepción vs. realidad</h4>
        <p className="mb-2 text-[11px] text-[var(--bp-ink-soft)]">
          Cada celda: lo que la persona se calificó (1-5 como %) contra el dato real de {getMonthLabel(survey.period)} y la diferencia. Más de {GAP_TOLERANCE} puntos se marca:
          <span style={{ color: "#b8860b" }}> se ve mejor de lo que muestran las métricas</span>, <span style={{ color: "var(--bp-blue-600)" }}>se ve peor</span>.
        </p>
        {answeredIds.length === 0 ? (
          <p className="text-[12px] text-[var(--bp-ink-soft)]">Todavía no hay respuestas.</p>
        ) : (
          <div className="overflow-x-auto rounded-[var(--bp-radius-md)] border border-[var(--bp-border)]">
            <table className="w-full min-w-[640px] border-collapse text-left text-[12px]">
              <thead>
                <tr className="border-b border-[var(--bp-border)] bg-[var(--bp-surface-alt)] text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
                  <th className="px-3 py-2">Estratega</th>
                  {ratings.map((q) => (
                    <th key={q.id} className="px-3 py-2" title={q.label}>{q.dimension ? DIMENSION_LABELS[q.dimension] : q.label.slice(0, 24)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {answeredIds.map((sid) => (
                  <tr key={sid} className="border-b border-[var(--bp-border)] last:border-0">
                    <td className="px-3 py-2 font-medium text-[var(--bp-ink)]">{nameOf(sid)}</td>
                    {ratings.map((q) => {
                      const v = responses[sid]?.[q.id];
                      const self = typeof v === "number" ? ratingToPercent(v) : null;
                      return (
                        <td key={q.id} className="px-3 py-2">
                          {q.dimension ? <GapCell self={self} actual={actualFor(q.dimension, records[sid])} /> : self !== null ? <span className="font-mono">{self}%</span> : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {texts.length > 0 && answeredIds.length > 0 && (
        <div>
          <h4 className="mb-2 text-[13px] font-semibold text-[var(--bp-ink)]">Respuestas abiertas</h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {texts.map((q) => (
              <div key={q.id} className="rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] p-3">
                <div className="text-[11px] font-semibold text-[var(--bp-ink)]">{q.label}</div>
                <ul className="mt-1.5 flex flex-col gap-1.5">
                  {answeredIds.filter((sid) => typeof responses[sid]?.[q.id] === "string" && responses[sid][q.id] !== "").map((sid) => (
                    <li key={sid} className="text-[12px] text-[var(--bp-ink)]"><strong>{nameOf(sid).split(" ")[0]}:</strong> {responses[sid][q.id]}</li>
                  ))}
                  {answeredIds.every((sid) => !responses[sid]?.[q.id]) && <li className="text-[12px] text-[var(--bp-ink-soft)]">Sin respuestas.</li>}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="mb-2 text-[13px] font-semibold text-[var(--bp-ink)]">Historial de la encuesta</h4>
        <ul className="max-h-64 overflow-auto rounded-[var(--bp-radius-md)] border border-[var(--bp-border)]">
          {events.map((e) => (
            <li key={e.id} className="flex flex-wrap items-baseline gap-x-3 border-b border-[var(--bp-border)] px-3 py-1.5 text-[12px] last:border-0">
              <span className="w-28 shrink-0 font-mono text-[11px] text-[var(--bp-ink-soft)]">{formatDateTime(e.at)}</span>
              <span className="w-32 shrink-0 font-medium text-[var(--bp-ink)]">{EVENT_LABEL[e.type] ?? e.type}</span>
              <span className="text-[var(--bp-ink-soft)]">{e.strategistId ? `${nameOf(e.strategistId)} · ` : ""}{e.detail}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default SurveyDetailView;
