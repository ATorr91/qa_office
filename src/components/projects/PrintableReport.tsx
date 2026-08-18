import type { ReactNode } from "react";
import Logo from "@/components/brand/Logo";
import { getReportHistory, type Project } from "@/lib/projects";

function formatDate(iso: string) {
  if (iso === "—") return iso;
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
}

/** Clean, black-on-white report layout shown only when printing (window.print → PDF). */
export function PrintableReport({ project }: { project: Project }) {
  const history = getReportHistory(project);
  const severity = project.bugsBySeverity;
  const generatedAt = new Date().toLocaleString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="hidden print:block" style={{ color: "#111", fontFamily: "var(--bp-font-body)" }}>
      <div className="flex items-center justify-between border-b-2 border-black pb-3">
        <Logo variant="dark" style={{ transform: "scale(0.8)", transformOrigin: "left center" }} />
        <div className="text-right text-[11px] text-gray-600">
          <div>Reporte de QA</div>
          <div>Generado el {generatedAt}</div>
        </div>
      </div>

      <div className="mt-4">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <p className="mt-1 text-[13px] text-gray-700">
          {project.client} · {project.category} · Estado: {project.status} · Prioridad: {project.priority}
        </p>
        <p className="mt-1 text-[13px] text-gray-700">
          {formatDate(project.startDate)} → {formatDate(project.endDate)}
        </p>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-gray-800">{project.description}</p>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-3 border-t border-b border-gray-300 py-4">
        <Metric label="Tasa de aprobación" value={`${project.passRate}%`} />
        <Metric label="Cobertura" value={`${project.coverage}%`} />
        <Metric label="Pruebas ejecutadas" value={project.testsExecuted.toLocaleString("es-MX")} />
        <Metric label="Bugs abiertos" value={`${project.bugsOpen} (${project.bugsCritical} críticos)`} />
      </div>

      <div className="mt-5">
        <h2 className="text-sm font-bold uppercase tracking-wide">Resumen</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-gray-800">{project.summary}</p>
      </div>

      <div className="mt-5">
        <h2 className="text-sm font-bold uppercase tracking-wide">Bugs por severidad</h2>
        <table className="mt-1.5 w-full text-left text-[12px]">
          <tbody>
            <tr>
              <Th>Crítico</Th>
              <Th>Alto</Th>
              <Th>Medio</Th>
              <Th>Bajo</Th>
            </tr>
            <tr>
              <Td>{severity.critical}</Td>
              <Td>{severity.high}</Td>
              <Td>{severity.medium}</Td>
              <Td>{severity.low}</Td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-5 break-inside-avoid">
        <h2 className="text-sm font-bold uppercase tracking-wide">Historial de reportes</h2>
        <table className="mt-1.5 w-full border-collapse text-left text-[11px]">
          <thead>
            <tr className="border-b border-gray-400">
              <Th>Fecha</Th>
              <Th>Aprob.</Th>
              <Th>Cob.</Th>
              <Th>Pruebas</Th>
              <Th>Bugs</Th>
              <Th>Nota</Th>
            </tr>
          </thead>
          <tbody>
            {history.map((r, i) => (
              <tr key={`${r.date}-${i}`} className="border-b border-gray-200">
                <Td>{r.date.slice(0, 10)}</Td>
                <Td>{r.passRate}%</Td>
                <Td>{r.coverage}%</Td>
                <Td>{r.testsExecuted}</Td>
                <Td>{r.bugsOpen}</Td>
                <Td>{r.note}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 break-inside-avoid">
        <h2 className="text-sm font-bold uppercase tracking-wide">Accionables</h2>
        <ul className="mt-1.5 flex flex-col gap-1 text-[12px]">
          {project.actionables.map((a, i) => (
            <li key={`${a.title}-${i}`}>
              {a.done ? "☑" : "☐"} {a.title} — {a.owner} · vence {formatDate(a.due)} · prioridad {a.priority}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 break-inside-avoid">
        <h2 className="text-sm font-bold uppercase tracking-wide">Equipo asignado</h2>
        <p className="mt-1.5 text-[12px] text-gray-800">
          {project.team.map((t) => `${t.name} (${t.role})`).join(" · ") || "Sin asignar"}
        </p>
      </div>

      <div className="mt-6 border-t border-gray-300 pt-2 text-center text-[10px] text-gray-500">
        BluePixel QA Office · Reporte generado automáticamente
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="py-1 pr-4 font-semibold">{children}</th>;
}

function Td({ children }: { children: ReactNode }) {
  return <td className="py-1 pr-4">{children}</td>;
}

export default PrintableReport;
