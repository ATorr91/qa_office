"use client";

import { useEffect, useState, type FormEvent } from "react";
import Logo from "@/components/brand/Logo";
import Button from "@/components/ui/Button";
import { getMonthLabel } from "@/lib/strategists";
import { RATING_MAX, type SelfEvalAnswers, type SelfEvalQuestion } from "@/lib/selfEvalTypes";

interface PublicSurvey {
  title: string;
  period: string;
  name: string;
  status: "open" | "closed" | "scheduled" | "cancelled";
  closesAt: string | null;
  questions: SelfEvalQuestion[];
  answers: SelfEvalAnswers | null;
  answeredAt: string | null;
}

const RATING_HINTS: Record<number, string> = { 1: "Muy bajo", 2: "Bajo", 3: "Regular", 4: "Bueno", 5: "Excelente" };

function formatClose(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", { timeZone: "America/Mexico_City", weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" });
}

function timeLeft(iso: string, now: number): string {
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return "El plazo terminó";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `Quedan ${h} h ${m} min` : `Quedan ${m} min`;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bp-surface-alt)] px-4 py-8">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <Logo variant="dark" style={{ transform: "scale(0.7)", transformOrigin: "left center" }} />
        {children}
      </div>
    </div>
  );
}

const CARD = "rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-5";

/** What a strategist sees from the link in their email: the questions, how long is left, and a way to send (or correct) their answers. */
export function SelfEvalForm({ token }: { token: string }) {
  const [survey, setSurvey] = useState<PublicSurvey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<SelfEvalAnswers>({});
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/self-eval/respond?token=${encodeURIComponent(token)}`, { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) return setError(json.error ?? "Este enlace no es válido.");
        setSurvey(json as PublicSurvey);
        setAnswers((json as PublicSurvey).answers ?? {});
      })
      .catch(() => !cancelled && setError("No pudimos cargar la encuesta. Intenta de nuevo."));
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  if (error) {
    return (
      <Shell>
        <div className={CARD}>
          <h1 className="text-lg font-bold text-[var(--bp-ink)]">No pudimos abrir tu encuesta</h1>
          <p className="mt-1 text-[13px] text-[var(--bp-ink-soft)]">{error}</p>
        </div>
      </Shell>
    );
  }
  if (!survey) return <Shell><p className="text-[13px] text-[var(--bp-ink-soft)]">Cargando…</p></Shell>;

  const open = survey.status === "open" && (!survey.closesAt || new Date(survey.closesAt).getTime() > now);
  if (!open) {
    return (
      <Shell>
        <div className={CARD}>
          <h1 className="text-lg font-bold text-[var(--bp-ink)]">{survey.status === "scheduled" ? "Esta encuesta todavía no abre" : survey.status === "cancelled" ? "Esta encuesta se canceló" : "Esta encuesta ya cerró"}</h1>
          <p className="mt-1 text-[13px] text-[var(--bp-ink-soft)]">
            {survey.answeredAt ? "Recibimos tu autoevaluación a tiempo. ¡Gracias!" : "Si crees que debías poder responder, escribe a administración para que reabran el plazo."}
          </p>
        </div>
      </Shell>
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/self-eval/respond", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, answers }) });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error ?? "No se pudo guardar tu respuesta.");
      } else {
        setSaved(true);
        setSurvey((s) => (s ? { ...s, answeredAt: new Date().toISOString(), answers } : s));
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      alert("No se pudo guardar tu respuesta. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  const set = (id: string, value: number | string) => {
    setSaved(false);
    setAnswers((a) => ({ ...a, [id]: value }));
  };

  return (
    <Shell>
      <div className={CARD}>
        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--bp-green)]">Autoevaluación · {getMonthLabel(survey.period)}</div>
        <h1 className="mt-1 text-xl font-bold text-[var(--bp-ink)]">Hola {survey.name}, ¿cómo te ves este periodo?</h1>
        <p className="mt-1 text-[13px] text-[var(--bp-ink-soft)]">
          Califícate con honestidad: no hay respuestas buenas ni malas, sirve para comparar tu percepción con lo que muestran las métricas. Calificaciones de 1 (muy bajo) a {RATING_MAX} (excelente).
        </p>
        {survey.closesAt && (
          <p className="mt-3 inline-block rounded-[var(--bp-radius-pill)] bg-[var(--bp-blue)]/10 px-3 py-1 text-[12px] font-semibold text-[var(--bp-blue-600)]">
            {timeLeft(survey.closesAt, now)} · cierra el {formatClose(survey.closesAt)} (hora CDMX)
          </p>
        )}
        {survey.answeredAt && (
          <p className="mt-3 text-[12px] font-medium text-[var(--bp-green)]">
            {saved ? "Guardamos tu respuesta ✓" : "Ya respondiste ✓"} — puedes corregirla y volver a enviarla hasta que cierre.
          </p>
        )}
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        {survey.questions.map((q, i) => (
          <div key={q.id} className={CARD}>
            <label className="text-[14px] font-semibold text-[var(--bp-ink)]">
              {i + 1}. {q.label} {q.required && <span className="text-[var(--bp-danger)]">*</span>}
            </label>
            {q.type === "rating" ? (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {Array.from({ length: RATING_MAX }, (_, k) => k + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => set(q.id, n)}
                    aria-pressed={answers[q.id] === n}
                    className={`bp-tap flex flex-col items-center gap-0.5 rounded-[var(--bp-radius-md)] border px-1 py-2 text-center transition-colors ${
                      answers[q.id] === n ? "border-[var(--bp-blue)] bg-[var(--bp-blue)]/10 text-[var(--bp-blue-600)]" : "border-[var(--bp-border)] text-[var(--bp-ink)] hover:border-[var(--bp-blue)]"
                    }`}
                  >
                    <span className="text-lg font-bold">{n}</span>
                    <span className="text-[10px] text-[var(--bp-ink-soft)]">{RATING_HINTS[n]}</span>
                  </button>
                ))}
              </div>
            ) : (
              <textarea
                rows={3}
                maxLength={2000}
                value={typeof answers[q.id] === "string" ? (answers[q.id] as string) : ""}
                onChange={(e) => set(q.id, e.target.value)}
                className="mt-2 w-full resize-y rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-3 py-2 text-[13px] text-[var(--bp-ink)] outline-none focus:border-[var(--bp-blue)]"
              />
            )}
          </div>
        ))}
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-[var(--bp-ink-soft)]">Tus respuestas las ve solo el equipo de administración.</p>
          <Button kind="primary" size="md" type="submit" disabled={busy}>
            {busy ? "Enviando…" : survey.answeredAt ? "Actualizar mi respuesta" : "Enviar mi autoevaluación"}
          </Button>
        </div>
      </form>
    </Shell>
  );
}

export default SelfEvalForm;
