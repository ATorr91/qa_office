"use client";

import { useCallback, useEffect, useState } from "react";
import AdminLoginForm, { fetchAdminSession } from "@/components/dashboard/admin/AdminLoginForm";
import CreateSurveyForm from "@/components/dashboard/selfeval/CreateSurveyForm";
import SurveyDetailView, { formatDateTime, STATUS_BADGE } from "@/components/dashboard/selfeval/SurveyDetailView";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { SURVEY_STATUS_LABEL, type MailStatus, type SurveySummary } from "@/lib/selfEvalTypes";
import { getMonthLabel } from "@/lib/strategists";

const CARD = "rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4";

/** Strategists rate themselves through a survey emailed to them; this is where admin creates, follows and reads those surveys. */
export function AutoevaluacionTab() {
  const [session, setSession] = useState<{ checked: boolean; authed: boolean; configured: boolean }>({ checked: false, authed: false, configured: true });
  const [surveys, setSurveys] = useState<SurveySummary[]>([]);
  const [mail, setMail] = useState<MailStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchAdminSession().then((s) => setSession({ checked: true, authed: s.authed, configured: s.configured }));
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/self-eval", { cache: "no-store" });
      const json = await res.json();
      if (res.status === 401) return setSession((s) => ({ ...s, authed: false }));
      if (!res.ok) return setError(json.error ?? "No se pudo cargar el historial.");
      setSurveys(json.surveys);
      setMail(json.mail);
      setError(null);
    } catch {
      setError("No se pudo conectar con el servidor.");
    }
  }, []);

  useEffect(() => {
    if (!session.authed) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const t = setInterval(() => void load(), 60_000);
    return () => clearInterval(t);
  }, [session.authed, load]);

  async function processNow() {
    setProcessing(true);
    try {
      await fetch("/api/self-eval/tick", { method: "POST" });
      await load();
    } finally {
      setProcessing(false);
    }
  }

  if (!session.checked) return null;
  if (!session.authed) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[12px] text-[var(--bp-ink-soft)]">Las encuestas y sus respuestas son solo para administración: inicia sesión para verlas.</p>
        <AdminLoginForm configured={session.configured} onSuccess={() => setSession((s) => ({ ...s, authed: true }))} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--bp-ink-soft)]">
          {mail && (
            <>
              <Badge color={mail.provider === "resend" ? "success" : "info"}>{mail.provider === "resend" ? "Correo: envío directo (Resend)" : "Correo: lo entrega el worker de Google"}</Badge>
              <span>{mail.queued} en cola</span>
              {mail.failed > 0 && <Badge color="danger">{mail.failed} con error</Badge>}
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Button kind="outline" size="sm" onClick={processNow} disabled={processing} data-tip="Envía lo programado, manda recordatorios y cierra lo vencido">
            {processing ? "Procesando…" : "Procesar pendientes ahora"}
          </Button>
          <Button kind="primary" size="sm" onClick={() => setCreating((v) => !v)}>
            {creating ? "Cerrar formulario" : "+ Nueva encuesta"}
          </Button>
        </div>
      </div>
      {error && <p role="alert" className="text-[12px] font-medium text-[var(--bp-danger)]">{error}</p>}

      {creating && (
        <CreateSurveyForm
          onCancel={() => setCreating(false)}
          onCreated={(id) => {
            setCreating(false);
            setSelected(id);
            void load();
          }}
        />
      )}

      {selected && <SurveyDetailView key={selected} id={selected} onChanged={() => void load()} onClose={() => setSelected(null)} />}

      <div className={CARD}>
        <h3 className="text-[13px] font-semibold text-[var(--bp-ink)]">Historial de encuestas</h3>
        <p className="mt-0.5 text-[11px] text-[var(--bp-ink-soft)]">Cada renglón es una ronda de autoevaluación con su plazo, quién respondió y cuándo cierra.</p>
        <div className="mt-3 overflow-x-auto rounded-[var(--bp-radius-md)] border border-[var(--bp-border)]">
          <table className="w-full min-w-[640px] border-collapse text-left text-[12px]">
            <thead>
              <tr className="border-b border-[var(--bp-border)] bg-[var(--bp-surface-alt)] text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
                <th className="px-3 py-2">Encuesta</th>
                <th className="px-3 py-2">Periodo</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Envío</th>
                <th className="px-3 py-2">Cierre</th>
                <th className="px-3 py-2 text-right">Respondieron</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {surveys.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-[12px] text-[var(--bp-ink-soft)]">
                    Aún no hay encuestas. Crea la primera con «Nueva encuesta».
                  </td>
                </tr>
              ) : (
                surveys.map((s) => (
                  <tr key={s.id} className={`border-b border-[var(--bp-border)] last:border-0 ${selected === s.id ? "bg-[var(--bp-blue)]/5" : ""}`}>
                    <td className="px-3 py-2 font-medium text-[var(--bp-ink)]">
                      {s.title}
                      {s.repeatMonthly && <span className="ml-1.5 text-[10px] font-normal text-[var(--bp-ink-soft)]">↻ mensual</span>}
                    </td>
                    <td className="px-3 py-2 text-[var(--bp-ink-soft)]">{getMonthLabel(s.period)}</td>
                    <td className="px-3 py-2"><Badge color={STATUS_BADGE[s.status]}>{SURVEY_STATUS_LABEL[s.status]}</Badge></td>
                    <td className="px-3 py-2 text-[var(--bp-ink-soft)]">{formatDateTime(s.sentAt ?? s.sendAt)}</td>
                    <td className="px-3 py-2 text-[var(--bp-ink-soft)]">{formatDateTime(s.closesAt)}</td>
                    <td className="px-3 py-2 text-right font-mono">{s.answered}/{s.invited}</td>
                    <td className="px-3 py-2 text-right">
                      <Button kind="outline" size="sm" onClick={() => setSelected(s.id)}>Ver detalle</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AutoevaluacionTab;
