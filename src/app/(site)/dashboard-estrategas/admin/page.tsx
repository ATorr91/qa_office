"use client";

import { useEffect, useState } from "react";
import AdminCapacityTools from "@/components/dashboard/admin/AdminCapacityTools";
import AdminDataForm from "@/components/dashboard/admin/AdminDataForm";
import AdminLoginForm, { adminLogout, fetchAdminSession } from "@/components/dashboard/admin/AdminLoginForm";
import AdminProfiles from "@/components/dashboard/admin/AdminProfiles";
import AdminSopLinks from "@/components/dashboard/admin/AdminSopLinks";
import AdminProjectProcess from "@/components/dashboard/admin/AdminProjectProcess";

const SECTIONS = [
  { id: "equipo", label: "Datos del equipo" },
  { id: "proyectos", label: "Proyectos y proceso" },
  { id: "herramientas", label: "Capacidad y herramientas" },
  { id: "perfiles", label: "Fortalezas y debilidades" },
  { id: "sops", label: "Enlaces de SOPs" },
] as const;
type Section = (typeof SECTIONS)[number]["id"];

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [checked, setChecked] = useState(false);
  const [section, setSection] = useState<Section>("equipo");

  // The section lives in the URL hash (#proyectos), so the dashboard can link straight to it.
  useEffect(() => {
    const fromHash = () => {
      const found = SECTIONS.find((x) => x.id === window.location.hash.slice(1));
      if (found) setSection(found.id);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  function selectSection(id: Section) {
    setSection(id);
    window.history.replaceState(null, "", `#${id}`);
  }

  useEffect(() => {
    fetchAdminSession().then((session) => {
      setAuthed(session.authed);
      setConfigured(session.configured);
      setChecked(true);
    });
  }, []);

  if (!checked) return null;

  if (!authed) {
    return <AdminLoginForm configured={configured} onSuccess={() => setAuthed(true)} />;
  }

  return (
    <div className="bp-anim-page flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="eyebrow" style={{ color: "var(--bp-green)" }}>
            Admin
          </div>
          <h1 className="mt-1.5 text-2xl font-bold text-[var(--bp-ink)]">Cargar información del equipo</h1>
          <p className="mt-1 max-w-2xl text-[13px] text-[var(--bp-ink-soft)]">
            Los datos que guardes aquí alimentan directamente el dashboard operativo — no hay datos ficticios de por medio.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              void adminLogout().then(() => setAuthed(false));
            }}
            className="text-[12px] font-medium text-[var(--bp-ink-soft)] underline-offset-2 hover:underline"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <div role="tablist" aria-label="Secciones de Admin" className="flex flex-wrap gap-1 border-b border-[var(--bp-border)] pb-2">
        {SECTIONS.map((x) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={section === x.id}
            onClick={() => selectSection(x.id)}
            className={`bp-tap rounded-[var(--bp-radius-pill)] border px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${section === x.id ? "border-[var(--bp-blue)] bg-[var(--bp-blue)]/10 text-[var(--bp-blue-600)]" : "border-[var(--bp-border)] text-[var(--bp-ink-soft)] hover:border-[var(--bp-blue)]"}`}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div key={section} className="bp-row-in">
        {section === "equipo" && <AdminDataForm />}
        {section === "proyectos" && <AdminProjectProcess />}
        {section === "herramientas" && <AdminCapacityTools />}
        {section === "perfiles" && <AdminProfiles />}
        {section === "sops" && <AdminSopLinks />}
      </div>
    </div>
  );
}
