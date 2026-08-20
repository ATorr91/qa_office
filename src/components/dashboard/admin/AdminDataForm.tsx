"use client";

import { useEffect, useState, type ReactNode } from "react";
import Button from "@/components/ui/Button";
import { EMPTY_MONTHLY_DATA, useStrategistRecords, type ManualMonthlyData } from "@/lib/strategistRecords";
import {
  getMonthLabel,
  monthKey,
  monthsInYear,
  okrStatusFromProgress,
  OKR_STATUS_LABELS,
  STRATEGISTS,
  YEARS,
  type CommentSentiment,
  type MonthKey,
  type Okr,
  type PeerComment,
  type ProjectAssignment,
} from "@/lib/strategists";

const PEER_LABELS = ["Par (Estrategia)", "Par (Diseño)", "Par (Producto)", "Líder de equipo", "Par (Investigación)", "Cliente"];

const INPUT_CLASS =
  "w-full rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-3 py-1.5 text-[13px] text-[var(--bp-ink)] outline-none focus:border-[var(--bp-blue)]";

const LATEST_YEAR = YEARS[YEARS.length - 1];
const DEFAULT_MONTH = monthsInYear(LATEST_YEAR).slice(-1)[0] ?? monthKey(LATEST_YEAR, 1);

function parseNumOrNull(v: string): number | null {
  const t = v.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
      <h3 className="text-[13px] font-semibold text-[var(--bp-ink)]">{title}</h3>
      {children}
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">{label}</label>
      <input type="number" value={value ?? ""} onChange={(e) => onChange(parseNumOrNull(e.target.value))} placeholder="Sin dato" className={INPUT_CLASS} />
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} placeholder="Sin dato" className={`${INPUT_CLASS} resize-y`} />
    </div>
  );
}

function CommentsEditor({ comments, onChange }: { comments: PeerComment[]; onChange: (v: PeerComment[]) => void }) {
  function update(i: number, patch: Partial<PeerComment>) {
    onChange(comments.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function remove(i: number) {
    onChange(comments.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...comments, { from: PEER_LABELS[0], comment: "", sentiment: "positivo" }]);
  }
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">Comentarios de peer review</label>
      {comments.map((c, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] p-2 sm:flex-row sm:items-start">
          <select value={c.from} onChange={(e) => update(i, { from: e.target.value })} className={`${INPUT_CLASS} sm:w-40`}>
            {PEER_LABELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <select value={c.sentiment} onChange={(e) => update(i, { sentiment: e.target.value as CommentSentiment })} className={`${INPUT_CLASS} sm:w-32`}>
            <option value="positivo">Positivo</option>
            <option value="constructivo">Constructivo</option>
          </select>
          <textarea value={c.comment} onChange={(e) => update(i, { comment: e.target.value })} rows={1} className={`${INPUT_CLASS} flex-1`} placeholder="Comentario" />
          <button type="button" onClick={() => remove(i)} className="shrink-0 text-[11px] text-[var(--bp-danger)] underline-offset-2 hover:underline">
            Eliminar
          </button>
        </div>
      ))}
      <button type="button" onClick={add} className="self-start text-[12px] font-semibold text-[var(--bp-blue-600)] underline-offset-2 hover:underline">
        + Añadir comentario
      </button>
    </div>
  );
}

function OkrsEditor({ okrs, onChange }: { okrs: Okr[]; onChange: (v: Okr[]) => void }) {
  function update(i: number, patch: Partial<Okr>) {
    onChange(okrs.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  }
  function updateProgress(i: number, progress: number) {
    update(i, { progress, status: okrStatusFromProgress(progress) });
  }
  function remove(i: number) {
    onChange(okrs.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...okrs, { objective: "", keyResult: "", progress: 0, status: okrStatusFromProgress(0) }]);
  }
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">OKRs del periodo</label>
      {okrs.map((o, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] p-2">
          <input value={o.objective} onChange={(e) => update(i, { objective: e.target.value })} placeholder="Objetivo" className={INPUT_CLASS} />
          <input value={o.keyResult} onChange={(e) => update(i, { keyResult: e.target.value })} placeholder="Key Result" className={INPUT_CLASS} />
          <div className="flex flex-wrap items-center gap-2">
            <input type="number" min={0} max={100} value={o.progress} onChange={(e) => updateProgress(i, Number(e.target.value))} className={`${INPUT_CLASS} w-24`} />
            <span className="text-[12px] text-[var(--bp-ink-soft)]">% avance · {OKR_STATUS_LABELS[o.status]}</span>
            <button type="button" onClick={() => remove(i)} className="ml-auto text-[11px] text-[var(--bp-danger)] underline-offset-2 hover:underline">
              Eliminar
            </button>
          </div>
        </div>
      ))}
      <button type="button" onClick={add} className="self-start text-[12px] font-semibold text-[var(--bp-blue-600)] underline-offset-2 hover:underline">
        + Añadir OKR
      </button>
    </div>
  );
}

function ProjectsEditor({ projects, onChange }: { projects: ProjectAssignment[]; onChange: (v: ProjectAssignment[]) => void }) {
  function update(i: number, patch: Partial<ProjectAssignment>) {
    onChange(projects.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }
  function remove(i: number) {
    onChange(projects.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...projects, { id: newId(), projectName: "", client: "", role: "", startDate: "", endDate: null, notes: "" }]);
  }
  return (
    <div className="flex flex-col gap-2">
      {projects.map((p, i) => (
        <div key={p.id} className="flex flex-col gap-2 rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] p-2">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input value={p.projectName} onChange={(e) => update(i, { projectName: e.target.value })} placeholder="Nombre del proyecto" className={INPUT_CLASS} />
            <input value={p.client} onChange={(e) => update(i, { client: e.target.value })} placeholder="Cliente" className={INPUT_CLASS} />
          </div>
          <input value={p.role} onChange={(e) => update(i, { role: e.target.value })} placeholder="Rol en el proyecto" className={INPUT_CLASS} />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">Inicio</label>
              <input type="date" value={p.startDate} onChange={(e) => update(i, { startDate: e.target.value })} className={INPUT_CLASS} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">Fin (vacío = en curso)</label>
              <input type="date" value={p.endDate ?? ""} onChange={(e) => update(i, { endDate: e.target.value || null })} className={INPUT_CLASS} />
            </div>
          </div>
          <textarea value={p.notes} onChange={(e) => update(i, { notes: e.target.value })} rows={2} placeholder="Notas (opcional)" className={`${INPUT_CLASS} resize-y`} />
          <button type="button" onClick={() => remove(i)} className="self-end text-[11px] text-[var(--bp-danger)] underline-offset-2 hover:underline">
            Eliminar proyecto
          </button>
        </div>
      ))}
      <button type="button" onClick={add} className="self-start text-[12px] font-semibold text-[var(--bp-blue-600)] underline-offset-2 hover:underline">
        + Añadir proyecto
      </button>
    </div>
  );
}

export function AdminDataForm() {
  const { getMonthData, setMonthData, getJiraBoard, setJiraBoard, getProjectHistory, setProjectHistory } = useStrategistRecords();
  const [strategistId, setStrategistId] = useState(STRATEGISTS[0].id);
  const [year, setYear] = useState(LATEST_YEAR);
  const [month, setMonth] = useState<MonthKey>(DEFAULT_MONTH);
  const [form, setForm] = useState<ManualMonthlyData>(EMPTY_MONTHLY_DATA);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const [boardKey, setBoardKey] = useState("");
  const [boardSavedAt, setBoardSavedAt] = useState<number | null>(null);

  const [projects, setProjects] = useState<ProjectAssignment[]>([]);
  const [projectsSavedAt, setProjectsSavedAt] = useState<number | null>(null);

  useEffect(() => {
    setForm(getMonthData(strategistId, month));
    setSavedAt(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strategistId, month]);

  useEffect(() => {
    setBoardKey(getJiraBoard(strategistId));
    setBoardSavedAt(null);
    setProjects(getProjectHistory(strategistId));
    setProjectsSavedAt(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strategistId]);

  function update<K extends keyof ManualMonthlyData>(key: K, value: ManualMonthlyData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    setMonthData(strategistId, month, form);
    setSavedAt(Date.now());
  }

  function handleSaveBoard() {
    setJiraBoard(strategistId, boardKey.trim());
    setBoardSavedAt(Date.now());
  }

  function handleSaveProjects() {
    setProjectHistory(strategistId, projects);
    setProjectsSavedAt(Date.now());
  }

  const strategist = STRATEGISTS.find((s) => s.id === strategistId)!;
  const monthsOfYear = monthsInYear(year);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4 rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">Estratega</label>
          <select value={strategistId} onChange={(e) => setStrategistId(e.target.value)} className={`${INPUT_CLASS} sm:w-56`}>
            {STRATEGISTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Section title="Tablero de Jira de este estratega">
        <p className="text-[12px] text-[var(--bp-ink-soft)]">
          Cada estratega puede tener su propio tablero/proyecto de Jira. Escribe la clave del proyecto (ej. <code>APAC</code>) tal
          como aparece en la URL de su tablero. Si lo dejas vacío, se usa el proyecto global configurado en el servidor (si existe).
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">Project key de Jira</label>
            <input value={boardKey} onChange={(e) => setBoardKey(e.target.value)} placeholder="ej. APAC" className={`${INPUT_CLASS} sm:w-56`} />
          </div>
          {boardSavedAt && <span className="text-[12px] font-medium text-[var(--bp-green)]">Guardado ✓</span>}
          <Button kind="outline" size="sm" onClick={handleSaveBoard}>
            Guardar tablero
          </Button>
        </div>
      </Section>

      <div className="flex flex-wrap items-end gap-4 rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">Año</label>
          <select
            value={year}
            onChange={(e) => {
              const y = Number(e.target.value);
              setYear(y);
              setMonth(monthsInYear(y).slice(-1)[0] ?? monthKey(y, 1));
            }}
            className={`${INPUT_CLASS} sm:w-28`}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">Mes</label>
          <div className="flex flex-wrap gap-1">
            {monthsOfYear.map((mk) => (
              <button
                key={mk}
                type="button"
                onClick={() => setMonth(mk)}
                className={`bp-tap rounded-[var(--bp-radius-pill)] border px-2.5 py-1.5 text-[12px] font-medium transition-colors duration-[var(--bp-dur)] ${
                  month === mk ? "border-[var(--bp-blue)] bg-[var(--bp-blue)]/10 text-[var(--bp-blue-600)]" : "border-[var(--bp-border)] text-[var(--bp-ink-soft)] hover:border-[var(--bp-blue)]"
                }`}
              >
                {getMonthLabel(mk).split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {savedAt && <span className="text-[12px] font-medium text-[var(--bp-green)]">Guardado ✓</span>}
          <Button kind="primary" size="md" onClick={handleSave}>
            Guardar cambios
          </Button>
        </div>
      </div>

      <p className="text-[12px] text-[var(--bp-ink-soft)]">
        Editando: <strong className="text-[var(--bp-ink)]">{strategist.name}</strong> · {getMonthLabel(month)}. Deja un campo vacío
        si aún no tienes ese dato — el dashboard mostrará &quot;Sin información disponible&quot; en vez de inventar un número.
      </p>

      <Section title="Peer reviews">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <NumberField label="Calificación de peer review (0-100)" value={form.peerReviewScore} onChange={(v) => update("peerReviewScore", v)} />
          <NumberField label="Evaluaciones recibidas" value={form.peerReviewCount} onChange={(v) => update("peerReviewCount", v)} />
        </div>
        <CommentsEditor comments={form.peerComments} onChange={(v) => update("peerComments", v)} />
      </Section>

      <Section title="OKRs y KPIs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <NumberField label="Cumplimiento de OKRs (0-100)" value={form.okrCompletion} onChange={(v) => update("okrCompletion", v)} />
          <NumberField label="Cumplimiento de KPIs (0-100)" value={form.kpiCompliance} onChange={(v) => update("kpiCompliance", v)} />
        </div>
        <OkrsEditor okrs={form.okrs} onChange={(v) => update("okrs", v)} />
      </Section>

      <Section title="Bitácoras">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <NumberField label="Bitácoras esperadas" value={form.bitacorasExpected} onChange={(v) => update("bitacorasExpected", v)} />
          <NumberField label="Bitácoras registradas" value={form.bitacorasSubmitted} onChange={(v) => update("bitacorasSubmitted", v)} />
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">Última bitácora</label>
            <input
              type="date"
              value={form.lastBitacoraDate ?? ""}
              onChange={(e) => update("lastBitacoraDate", e.target.value || null)}
              className={INPUT_CLASS}
            />
          </div>
        </div>
      </Section>

      <Section title="Calificación QA">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <NumberField label="Calificación QA (0-100)" value={form.qaScore} onChange={(v) => update("qaScore", v)} />
          <NumberField label="Entregables revisados" value={form.qaReviewsCount} onChange={(v) => update("qaReviewsCount", v)} />
          <NumberField label="Hallazgos encontrados" value={form.qaIssuesFound} onChange={(v) => update("qaIssuesFound", v)} />
        </div>
      </Section>

      <Section title="NPS / Feedback del cliente">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <NumberField label="Clientes promotores" value={form.npsPromoters} onChange={(v) => update("npsPromoters", v)} />
          <NumberField label="Clientes pasivos" value={form.npsPassives} onChange={(v) => update("npsPassives", v)} />
          <NumberField label="Clientes detractores" value={form.npsDetractors} onChange={(v) => update("npsDetractors", v)} />
        </div>
      </Section>

      <Section title="Autoevaluación guiada">
        <TextField label="Mayor victoria" value={form.selfAssessmentBiggestWin} onChange={(v) => update("selfAssessmentBiggestWin", v)} />
        <TextField label="Peor error / aprendizaje" value={form.selfAssessmentMistakeLearning} onChange={(v) => update("selfAssessmentMistakeLearning", v)} />
        <TextField label="Habilidad técnica a desarrollar" value={form.selfAssessmentSkillToDevelop} onChange={(v) => update("selfAssessmentSkillToDevelop", v)} />
      </Section>

      <div className="rounded-[var(--bp-radius-md)] border border-dashed border-[var(--bp-border)] bg-[var(--bp-surface)] p-3 text-[12px] text-[var(--bp-ink-soft)]">
        Cumplimiento de deadlines no se edita aquí — se conecta en vivo al tablero de Jira configurado arriba para este estratega.
      </div>

      <div className="flex items-center justify-end gap-3">
        {savedAt && <span className="text-[12px] font-medium text-[var(--bp-green)]">Guardado ✓</span>}
        <Button kind="primary" size="md" onClick={handleSave}>
          Guardar cambios
        </Button>
      </div>

      <Section title="Historial de proyectos">
        <p className="text-[12px] text-[var(--bp-ink-soft)]">
          No depende del mes seleccionado — es la lista completa de proyectos que ha tenido {strategist.name} a lo largo del tiempo.
        </p>
        <ProjectsEditor projects={projects} onChange={setProjects} />
        <div className="flex items-center justify-end gap-3">
          {projectsSavedAt && <span className="text-[12px] font-medium text-[var(--bp-green)]">Guardado ✓</span>}
          <Button kind="outline" size="sm" onClick={handleSaveProjects}>
            Guardar historial de proyectos
          </Button>
        </div>
      </Section>
    </div>
  );
}

export default AdminDataForm;
