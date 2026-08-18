"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";

const ADMIN_PASSWORD = "12345678";
const SESSION_KEY = "bp-dashboard-estrategas-admin-authed";

export function AdminLoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      try {
        window.sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        // Private browsing or storage unavailable — session just won't persist across reloads.
      }
      setError(false);
      onSuccess();
    } else {
      setError(true);
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-sm rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-6">
      <h1 className="text-[15px] font-bold text-[var(--bp-ink)]">Acceso Admin</h1>
      <p className="mt-1 text-[12px] text-[var(--bp-ink-soft)]">
        Ingresa la contraseña para cargar y editar la información del equipo de estrategas.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
          placeholder="Contraseña"
          autoFocus
          className={`w-full rounded-[var(--bp-radius-sm)] border bg-[var(--bp-surface)] px-3 py-2 text-[13px] text-[var(--bp-ink)] outline-none focus:border-[var(--bp-blue)] ${
            error ? "border-[var(--bp-danger)]" : "border-[var(--bp-border)]"
          }`}
        />
        {error && <p className="text-[12px] text-[var(--bp-danger)]">Contraseña incorrecta.</p>}
        <Button type="submit" kind="primary" size="md">
          Entrar
        </Button>
      </form>
    </div>
  );
}

export function isAdminAuthed(): boolean {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearAdminAuth(): void {
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // no-op
  }
}

export default AdminLoginForm;
