"use client";

import { useEffect, useState } from "react";
import AdminDataForm from "@/components/dashboard/admin/AdminDataForm";
import AdminLoginForm, { adminLogout, fetchAdminSession } from "@/components/dashboard/admin/AdminLoginForm";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [checked, setChecked] = useState(false);

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

      <AdminDataForm />
    </div>
  );
}
