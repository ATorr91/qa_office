"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";

export interface AdminSession {
  /** False when the server has no ADMIN_PASSWORD, so nobody can log in. */
  configured: boolean;
  authed: boolean;
}

/** Asks the server whether this browser holds a valid admin session (an httpOnly cookie it can't read itself). */
export async function fetchAdminSession(): Promise<AdminSession> {
  try {
    const res = await fetch("/api/admin/session", { cache: "no-store" });
    return (await res.json()) as AdminSession;
  } catch {
    return { configured: true, authed: false };
  }
}

export async function adminLogout(): Promise<void> {
  await fetch("/api/admin/session", { method: "DELETE" }).catch(() => undefined);
}

export function AdminLoginForm({ onSuccess, configured = true }: { onSuccess: () => void; configured?: boolean }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setError(null);
        onSuccess();
        return;
      }
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "No se pudo iniciar sesión.");
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setBusy(false);
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
            setError(null);
          }}
          placeholder="Contraseña"
          autoFocus
          className={`w-full rounded-[var(--bp-radius-sm)] border bg-[var(--bp-surface)] px-3 py-2 text-[13px] text-[var(--bp-ink)] outline-none focus:border-[var(--bp-blue)] ${
            error ? "border-[var(--bp-danger)]" : "border-[var(--bp-border)]"
          }`}
        />
        {!configured && (
          <p className="text-[12px] text-[var(--bp-danger)]">
            El servidor no tiene ADMIN_PASSWORD configurada: agrégala en .env.local (y en Vercel) y reinicia.
          </p>
        )}
        {error && <p className="text-[12px] text-[var(--bp-danger)]">{error}</p>}
        <Button type="submit" kind="primary" size="md" disabled={busy || !configured}>
          {busy ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </div>
  );
}

export default AdminLoginForm;
