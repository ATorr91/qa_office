"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Empty, Panel } from "@/components/dashboard/cerebro/parts";
import { fetchAdminSession } from "@/components/dashboard/admin/AdminLoginForm";
import StrategistAvatar from "@/components/dashboard/StrategistAvatar";
import Badge from "@/components/ui/Badge";
import ExportMenu from "@/components/proceso/ExportMenu";
import type { PdfJob } from "@/components/proceso/ExportMenu";
import type { Cerebro } from "@/lib/cerebro";
import { projectsOwnedBy } from "@/lib/projectCatalog";
import { useProjectProcess } from "@/lib/projectProcess";
import { todayInMexico } from "@/lib/projectHours";
import { STRATEGISTS } from "@/lib/strategists";
import { buildSnapshot, type TeamAnalysis } from "@/lib/teamAnalysis";
import { analysisToMarkdown } from "@/lib/teamAnalysisMarkdown";

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const monthLabel = (m: string) => `${MONTHS[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`;
const PRIORITY: Record<string, "danger" | "warning" | "neutral"> = { alta: "danger", media: "warning", baja: "neutral" };
const FOLLOW: Record<string, { label: string; color: "success" | "warning" | "neutral" }> = {
  avanzo: { label: "Avanzó", color: "success" },
  sin_evidencia: { label: "Sin evidencia", color: "warning" },
  cambio_contexto: { label: "Cambió el contexto", color: "neutral" },
};

interface Loaded {
  configured: boolean;
  aiConfigured: boolean;
  analyses: TeamAnalysis[];
}

/** The AI reading of the team, month by month: what the director should do with the team and with each person this month. */
export default function AnalisisEquipo({ cerebro, periodLabel, onPdf }: { cerebro: Cerebro; periodLabel: string; onPdf: (job: PdfJob) => void }) {
  const { settings } = useProjectProcess();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [local, setLocal] = useState<TeamAnalysis | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const thisMonth = todayInMexico().slice(0, 7);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/team-analysis", { cache: "no-store" });
      const json = (await res.json()) as Loaded & { error?: string };
      if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`);
      setLoaded(json);
      setSelected((cur) => cur ?? json.analyses[0]?.month ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo leer el historial.");
    }
  }, []);

  useEffect(() => {
    let alive = true;
    fetchAdminSession().then((s) => {
      if (!alive) return;
      setAuthed(s.authed);
      if (s.authed) void load();
    });
    return () => {
      alive = false;
    };
  }, [load]);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const snapshot = buildSnapshot(cerebro, periodLabel, new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" }), settings.profiles, (s) => projectsOwnedBy(s.id).filter((p) => p.status === "active").map((p) => p.name));
      const res = await fetch("/api/team-analysis", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ snapshot }) });
      const json = (await res.json()) as { analysis?: TeamAnalysis; stored?: boolean; error?: string };
      if (!res.ok || !json.analysis) throw new Error(json.error ?? `Error ${res.status}`);
      setLocal(json.analysis);
      setSelected(json.analysis.month);
      if (json.stored) await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar el análisis.");
    } finally {
      setBusy(false);
    }
  }

  if (authed === null) return <p className="text-[12px] text-[var(--bp-ink-soft)]">Cargando…</p>;
  if (!authed) {
    return (
      <Empty>
        El análisis habla de personas, así que solo lo ve la dirección.{" "}
        <Link href="/dashboard-estrategas/admin" className="font-semibold text-[var(--bp-blue-600)] hover:underline">
          Entrar como admin
        </Link>
      </Empty>
    );
  }

  const analyses = [...(loaded?.analyses ?? [])];
  if (local && !analyses.some((a) => a.month === local.month)) analyses.unshift(local);
  const current = analyses.find((a) => a.month === selected) ?? analyses[0] ?? null;
  const aiOk = loaded?.aiConfigured ?? true;
  const hasThisMonth = analyses.some((a) => a.month === thisMonth);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={generate} disabled={busy || !aiOk} className="bp-tap rounded-[var(--bp-radius-md)] bg-[var(--bp-blue)] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--bp-blue-600)] disabled:opacity-50">
          {busy ? "Analizando al equipo…" : hasThisMonth ? `Regenerar el análisis de ${monthLabel(thisMonth)}` : `Generar el análisis de ${monthLabel(thisMonth)}`}
        </button>
        {analyses.length > 0 && (
          <label className="flex items-center gap-2 text-[12px] text-[var(--bp-ink-soft)]">
            Mes
            <select value={current?.month ?? ""} onChange={(e) => setSelected(e.target.value)} className="rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-2 py-1 text-[12px] font-medium text-[var(--bp-ink)] outline-none focus:border-[var(--bp-blue)]">
              {analyses.map((a) => (
                <option key={a.month} value={a.month}>
                  {monthLabel(a.month)}
                </option>
              ))}
            </select>
          </label>
        )}
        {current && <ExportMenu subject="el análisis del equipo" filename={`analisis-equipo-${current.month}`} getMarkdown={() => analysisToMarkdown(current)} onPdf={onPdf} />}
      </div>

      {!aiOk && <Empty>Falta la clave de IA en el servidor (ANTHROPIC_API_KEY). Con ella el análisis se genera aquí y queda guardado por mes.</Empty>}
      {loaded && !loaded.configured && <p className="text-[12px] text-[var(--bp-ink-soft)]">Sin base de datos: el análisis se muestra solo en esta sesión y no queda guardado por mes.</p>}
      {error && (
        <p role="alert" className="rounded-[var(--bp-radius-md)] border border-[var(--bp-danger)] px-3 py-2 text-[12px] text-[var(--bp-danger)]">
          {error}
        </p>
      )}

      {busy && <p className="text-[12px] text-[var(--bp-ink-soft)]">Puede tardar un par de minutos. Se envía a Anthropic el resumen de desempeño, proyectos y notas del equipo.</p>}

      {!current && !busy && aiOk && <Empty>Todavía no hay un análisis. Genera el de este mes: toma el desempeño, el proceso, los proyectos y las notas de fortalezas y debilidades.</Empty>}

      {current && (
        <>
          <Panel title={`Resumen de ${monthLabel(current.month)}`} hint={`Generado con IA (${current.model}) el ${current.generatedAt.slice(0, 10)}. Revísalo antes de actuar.`}>
            <p className="max-w-[75ch] text-[14px] leading-relaxed text-[var(--bp-ink)]">{current.summary}</p>
          </Panel>

          {current.followUp.length > 0 && (
            <Panel title="Seguimiento del mes anterior" hint="Qué pasó con lo que se había propuesto.">
              <ul className="divide-y divide-[var(--bp-border)]">
                {current.followUp.map((f, i) => (
                  <li key={i} className="flex flex-wrap items-start gap-x-3 gap-y-1 py-2 text-[13px]">
                    <Badge color={FOLLOW[f.status].color} dot={false}>
                      {FOLLOW[f.status].label}
                    </Badge>
                    <span className="min-w-0 flex-1">
                      <span className="font-medium text-[var(--bp-ink)]">{f.action}</span>
                      <span className="block text-[12px] text-[var(--bp-ink-soft)]">{f.note}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <Panel title="Acciones para el equipo" hint="Lo que la dirección debe mover este mes.">
            <ul className="bp-stagger divide-y divide-[var(--bp-border)]">
              {current.teamActions.map((t, i) => (
                <li key={i} className="flex flex-wrap items-start gap-x-3 gap-y-1 py-2.5 text-[13px]">
                  <Badge color={PRIORITY[t.priority]} dot={false}>
                    {t.priority}
                  </Badge>
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold text-[var(--bp-ink)]">{t.action}</span>
                    <span className="block text-[12px] text-[var(--bp-ink-soft)]">{t.why}</span>
                  </span>
                  <span className="text-[11px] font-semibold text-[var(--bp-ink-soft)]">{t.owner}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            {current.people.map((p) => {
              const s = STRATEGISTS.find((x) => x.id === p.strategistId);
              if (!s) return null;
              return (
                <Panel key={p.strategistId} title={s.name} hint={p.headline}>
                  <div className="mb-2">
                    <Link href={`/dashboard-estrategas/perfil/${s.id}`} className="inline-block rounded-[var(--bp-radius-sm)] hover:opacity-80">
                      <StrategistAvatar strategist={s} size={26} />
                    </Link>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {p.actions.map((x, i) => (
                      <li key={i} className="text-[13px] leading-snug">
                        <span className="font-medium text-[var(--bp-ink)]">{x.action}</span>
                        <span className="block text-[12px] text-[var(--bp-ink-soft)]">{x.why}</span>
                      </li>
                    ))}
                  </ul>
                </Panel>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
