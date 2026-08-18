"use client";

import Button from "./Button";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="bp-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={onCancel}
    >
      <div
        className="bp-modal-panel w-full max-w-sm rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-5 shadow-[var(--bp-shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-base font-semibold text-[var(--bp-ink)]">
          {title}
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--bp-ink-soft)]">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button kind="outline" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            kind={danger ? "primary" : "primary"}
            size="sm"
            onClick={onConfirm}
            className={danger ? "!bg-[var(--bp-danger)] hover:!bg-[var(--bp-danger)]/85" : ""}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
