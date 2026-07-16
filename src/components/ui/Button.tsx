import type { ButtonHTMLAttributes } from "react";

type ButtonKind = "primary" | "outline" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: ButtonKind;
}

const KIND_CLASSES: Record<ButtonKind, string> = {
  primary:
    "bg-[var(--bp-blue)] text-white hover:bg-[var(--bp-blue-600)] hover:shadow-[var(--bp-shadow-blue)] hover:-translate-y-px",
  outline:
    "bg-transparent text-[var(--bp-ink)] border-[var(--bp-border)] hover:border-[var(--bp-blue)]",
  ghost:
    "bg-transparent text-[var(--bp-ink)] border-transparent hover:bg-[var(--bp-blue-tint)]",
};

/** BluePixel button primitive, ported from the marketing site's `Btn` pattern. */
export function Button({ kind = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-[var(--bp-radius-md)] border-2 px-6 py-3 font-bold text-[15px] transition-all duration-[var(--bp-dur)] ease-[var(--bp-ease)] cursor-pointer ${KIND_CLASSES[kind]} ${className}`}
      {...props}
    />
  );
}

export default Button;
