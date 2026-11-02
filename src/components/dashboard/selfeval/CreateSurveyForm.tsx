"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Button from "@/components/ui/Button";
import {
  DEFAULT_QUESTIONS,
  DEFAULT_REMINDER_HOURS,
  DEFAULT_WINDOW_HOURS,
  DIMENSION_LABELS,
  type CreateSurveyInput,
  type Dimension,
  type SelfEvalQuestion,
} from "@/lib/selfEvalTypes";
import { allMonthsWithData, getMonthLabel, STRATEGISTS } from "@/lib/strategists";

const FIELD =
  "rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-2.5 py-1.5 text-[12px] text-[var(--bp-ink)] outline-none focus:border-[var(--bp-blue)]";
const REMINDER_OPTIONS = [1, 3, 6, 12, 18];
const MONTHS = [...allMonthsWithData()].reverse();

function Block({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <h4 className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-ink)]">{title}</h4>
        {hint && <p className="text-[11px] text-[var(--bp-ink-soft)]">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

/** Builds a survey: questions, who gets it, when it goes out, how long they have, reminders and monthly repetition. */
export function CreateSurveyForm({ onCreated, onCancel }: { onCreated: (id: string) => void; onCancel: () => void }) {
  const [period, setPeriod] = useState(MONTHS[0]);
  const [title, setTitle] = useState(`Autoevaluación ${getMonthLabel(MONTHS[0])}`);
  const [questions, setQuestions] = useState<SelfEvalQuestion[]>(DEFAULT_QUESTIONS);
  const [recipients, setRecipients] = useState<Record<string, { on: boolean; email: string }>>(
    Object.fromEntries(STRATEGISTS.map((s) => [s.id, { on: true, email: s.email }])),
  );
  const [sendMode, setSendMode] = useState<"now" | "later">("now");
  const [sendAt, setSendAt] = useState("");
  const [windowHours, setWindowHours] = useState(DEFAULT_WINDOW_HOURS);
  const [reminders, setReminders] = useState<number[]>(DEFAULT_REMINDER_HOURS);
  const [repeatMonthly, setRepeatMonthly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chosen = STRATEGISTS.filter((s) => recipients[s.id].on);
  const updateQuestion = (i: number, patch: Partial<SelfEvalQuestion>) => setQuestions((qs) => qs.map((q, k) => (k === i ? { ...q, ...patch } : q)));

  function addQuestion(type: "rating" | "text") {
    setQuestions((qs) => [...qs, { id: `q${Date.now().toString(36)}`, type, label: "", dimension: null, required: type === "rating" }]);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    if (sendMode === "later" && !sendAt) return setError("Elige la fecha y hora de envío.");
    const input: CreateSurveyInput = {
      title,
      period,
      questions,
      recipients: chosen.map((s) => ({ strategistId: s.id, email: recipients[s.id].email })),
      sendAt: sendMode === "later" ? new Date(sendAt).toISOString() : null,
      windowHours,
      reminderHours: reminders.filter((h) => h < windowHours),
      repeatMonthly,
    };
    setBusy(true);
    try {
      const res = await fetch("/api/self-eval", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "No se pudo crear la encuesta.");
      else onCreated(json.id);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5 rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
      <h3 className="text-[14px] font-semibold text-[var(--bp-ink)]">Nueva encuesta de autoevaluación</h3>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">Título</span>
          <input className={FIELD} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">Periodo que se evalúa</span>
          <select
            className={FIELD}
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value);
              setTitle((t) => (t.startsWith("Autoevaluación ") ? `Autoevaluación ${getMonthLabel(e.target.value)}` : t));
            }}
          >
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {getMonthLabel(m)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Block title="Preguntas" hint="Las calificaciones son de 1 a 5. Las que ligas a una métrica se comparan con el dato real en los resultados (percepción vs. realidad).">
        <div className="flex flex-col gap-2">
          {questions.map((q, i) => (
            <div key={q.id} className="flex flex-wrap items-center gap-2 rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] p-2">
              <span className="w-5 text-center text-[11px] font-bold text-[var(--bp-ink-soft)]">{i + 1}</span>
              <span className="rounded-[var(--bp-radius-pill)] bg-[var(--bp-surface-alt)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--bp-ink-soft)]">{q.type === "rating" ? "1-5" : "Texto"}</span>
              <input className={`${FIELD} min-w-[220px] flex-1`} value={q.label} onChange={(e) => updateQuestion(i, { label: e.target.value })} placeholder="Escribe la pregunta" maxLength={300} />
              {q.type === "rating" && (
                <select className={FIELD} value={q.dimension ?? ""} onChange={(e) => updateQuestion(i, { dimension: (e.target.value || null) as Dimension | null })} aria-label="Métrica con la que se compara">
                  <option value="">Sin comparar</option>
                  {(Object.keys(DIMENSION_LABELS) as Dimension[]).map((d) => (
                    <option key={d} value={d}>
                      Compara con: {DIMENSION_LABELS[d]}
                    </option>
                  ))}
                </select>
              )}
              <label className="flex items-center gap-1 text-[11px] text-[var(--bp-ink-soft)]">
                <input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(i, { required: e.target.checked })} /> Obligatoria
              </label>
              <button type="button" onClick={() => setQuestions((qs) => qs.filter((_, k) => k !== i))} className="text-[11px] text-[var(--bp-danger)] hover:underline" aria-label={`Quitar la pregunta ${i + 1}`}>
                Quitar
              </button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <Button kind="outline" size="sm" type="button" onClick={() => addQuestion("rating")}>
              + Calificación 1-5
            </Button>
            <Button kind="outline" size="sm" type="button" onClick={() => addQuestion("text")}>
              + Respuesta abierta
            </Button>
            <Button kind="ghost" size="sm" type="button" onClick={() => setQuestions(DEFAULT_QUESTIONS)}>
              Restablecer plantilla
            </Button>
          </div>
        </div>
      </Block>

      <Block title="¿A quién se le manda?" hint="Cada persona recibe un enlace personal en su correo. Puedes corregir un correo antes de enviar.">
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {STRATEGISTS.map((s) => (
            <div key={s.id} className="flex items-center gap-2 rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] px-2 py-1.5">
              <input
                type="checkbox"
                checked={recipients[s.id].on}
                onChange={(e) => setRecipients((r) => ({ ...r, [s.id]: { ...r[s.id], on: e.target.checked } }))}
                aria-label={`Enviar a ${s.name}`}
              />
              <span className="w-32 shrink-0 truncate text-[12px] font-medium text-[var(--bp-ink)]">{s.name}</span>
              <input
                className={`${FIELD} min-w-0 flex-1`}
                type="email"
                value={recipients[s.id].email}
                disabled={!recipients[s.id].on}
                onChange={(e) => setRecipients((r) => ({ ...r, [s.id]: { ...r[s.id], email: e.target.value } }))}
                aria-label={`Correo de ${s.name}`}
              />
            </div>
          ))}
        </div>
      </Block>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Block title="Envío">
          <div className="flex flex-wrap items-center gap-3 text-[12px] text-[var(--bp-ink)]">
            <label className="flex items-center gap-1.5">
              <input type="radio" checked={sendMode === "now"} onChange={() => setSendMode("now")} /> Enviar ahora
            </label>
            <label className="flex items-center gap-1.5">
              <input type="radio" checked={sendMode === "later"} onChange={() => setSendMode("later")} /> Programar
            </label>
            {sendMode === "later" && <input type="datetime-local" className={FIELD} value={sendAt} onChange={(e) => setSendAt(e.target.value)} />}
          </div>
          <label className="flex items-center gap-1.5 text-[12px] text-[var(--bp-ink)]">
            <input type="checkbox" checked={repeatMonthly} onChange={(e) => setRepeatMonthly(e.target.checked)} /> Repetir cada mes (se programa sola la siguiente al cerrar)
          </label>
        </Block>

        <Block title="Plazo y recordatorios" hint="El plazo corre desde que se envía. Los recordatorios solo le llegan a quien no ha respondido.">
          <label className="flex items-center gap-2 text-[12px] text-[var(--bp-ink)]">
            Plazo para responder
            <input type="number" min={1} max={168} className={`${FIELD} w-20 text-right`} value={windowHours} onChange={(e) => setWindowHours(Number(e.target.value))} /> horas
          </label>
          <div className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--bp-ink)]">
            Recordar cuando falten:
            {REMINDER_OPTIONS.filter((h) => h < windowHours).map((h) => (
              <label key={h} className="flex items-center gap-1">
                <input type="checkbox" checked={reminders.includes(h)} onChange={(e) => setReminders((r) => (e.target.checked ? [...r, h] : r.filter((x) => x !== h)))} /> {h} h
              </label>
            ))}
          </div>
        </Block>
      </div>

      {error && <p role="alert" className="text-[12px] font-medium text-[var(--bp-danger)]">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-[var(--bp-ink-soft)]">
          {chosen.length} {chosen.length === 1 ? "persona" : "personas"} · {sendMode === "now" ? "se manda al guardar" : "se manda en la fecha elegida"} · {windowHours} h para responder
        </p>
        <div className="flex gap-2">
          <Button kind="outline" size="md" type="button" onClick={onCancel}>
            Cancelar
          </Button>
          <Button kind="primary" size="md" type="submit" disabled={busy || chosen.length === 0}>
            {busy ? "Guardando…" : sendMode === "now" ? "Crear y enviar" : "Crear y programar"}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default CreateSurveyForm;
