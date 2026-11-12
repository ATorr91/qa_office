import Card from "@/components/ui/Card";
import { ioOf } from "@/lib/procesoIo";
import { ACCEPTANCE_FORMAT } from "@/lib/procesoStages";
import type { ProcessStage } from "@/lib/procesoTypes";

/** The report that closes a stage, laid out as the paper the client signs. It is also what gets printed. */
export function AcceptanceDocument({ stage }: { stage: ProcessStage }) {
  const { header, sections, signoff } = ACCEPTANCE_FORMAT;
  const blank = <span className="inline-block h-4 w-full border-b border-dashed border-[var(--bp-border)] align-bottom" />;
  return (
    <Card className="p-6 print:rounded-none print:border-0 print:p-0 print:shadow-none" aria-label={`Formato de aceptación de ${stage.name}`}>
      <div className="eyebrow">BluePixel Studio · Aceptación de etapa</div>
      <h4 className="mt-1 text-xl font-bold text-[var(--bp-ink)]">{stage.deliverable.title}</h4>

      <dl className="mt-4 grid gap-x-6 gap-y-3 md:grid-cols-2">
        {header.map((field) => (
          <div key={field}>
            <dt className="text-[11px] font-semibold text-[var(--bp-ink-soft)]">{field}</dt>
            <dd className="mt-1">
              {field === "Etapa" ? (
                <span className="text-[13px] font-semibold text-[var(--bp-ink)]">
                  {stage.number}. {stage.name}
                </span>
              ) : (
                blank
              )}
            </dd>
          </div>
        ))}
      </dl>

      <ol className="mt-6 flex flex-col gap-5">
        {sections.map((section, i) => (
          <li key={section} className="break-inside-avoid">
            <div className="text-[13px] font-bold text-[var(--bp-ink)]">
              {i + 1}. {section}
            </div>
            {i === 2 ? (
              <>
                <ul className="mt-1.5 list-disc pl-5 text-[13px] text-[var(--bp-ink)]">
                  {stage.deliverable.contents.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                <table className="mt-3 w-full border-collapse text-[12px]">
                  <thead>
                    <tr className="border-b border-[var(--bp-border)] text-left text-[11px] text-[var(--bp-ink-soft)]">
                      <th className="py-1.5 pr-3 font-semibold">Archivo entregado</th>
                      <th className="py-1.5 pr-3 font-semibold">Formato</th>
                      <th className="w-40 py-1.5 font-semibold">Enlace</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ioOf(stage)
                      .outputs.filter((f) => f.name !== stage.deliverable.title)
                      .map((f) => (
                        <tr key={f.name} className="border-b border-[var(--bp-border)] align-top">
                          <td className="py-1.5 pr-3 text-[var(--bp-ink)]">{f.name}</td>
                          <td className="py-1.5 pr-3 text-[var(--bp-ink-soft)]">{f.format}</td>
                          <td className="py-1.5">{blank}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </>
            ) : i === 3 ? (
              <table className="mt-1.5 w-full border-collapse text-[12px]">
                <thead>
                  <tr className="border-b border-[var(--bp-border)] text-left text-[11px] text-[var(--bp-ink-soft)]">
                    <th className="py-1.5 pr-3 font-semibold">Criterio</th>
                    <th className="py-1.5 pr-3 font-semibold">Evidencia</th>
                    <th className="w-24 py-1.5 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {stage.deliverable.criteria.map((c) => (
                    <tr key={c.criterion} className="border-b border-[var(--bp-border)] align-top">
                      <td className="py-1.5 pr-3 text-[var(--bp-ink)]">{c.criterion}</td>
                      <td className="py-1.5 pr-3 text-[var(--bp-ink-soft)]">{c.evidence}</td>
                      <td className="py-1.5 text-[var(--bp-ink-soft)]">☐ Cumple</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="mt-2 flex flex-col gap-2.5">
                {blank}
                {blank}
              </div>
            )}
          </li>
        ))}
      </ol>

      <div className="mt-7 break-inside-avoid rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] p-4">
        <div className="text-[13px] font-bold text-[var(--bp-ink)]">Registro de aceptación del cliente</div>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-[var(--bp-ink)]">
          {signoff.statuses.map((s) => (
            <span key={s}>☐ {s}</span>
          ))}
        </div>
        <dl className="mt-3 grid gap-x-6 gap-y-3 md:grid-cols-2">
          {signoff.fields.map((f) => (
            <div key={f}>
              <dt className="text-[11px] font-semibold text-[var(--bp-ink-soft)]">{f}</dt>
              <dd className="mt-3">{blank}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-[11px] text-[var(--bp-ink-soft)]">{signoff.reviewWindow}</p>
      </div>
    </Card>
  );
}

export default AcceptanceDocument;
