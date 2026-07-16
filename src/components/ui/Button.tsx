import type { ButtonHTMLAttributes } from "react";

type ButtonKind = "primary" | "outline" | "ghost";
type ButtonSize = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: ButtonKind;
  size?: ButtonSize;
}

const KIND_CLASSES: Record<ButtonKind, string> = {
  primary:
    "bg-[var(--bp-blue)] text-white hover:bg-[var(--bp-blue-600)] hover:shadow-[var(--bp-shadow-blue)] hover:-translate-y-px",
  outline:
    "bg-transparent text-[var(--bp-ink)] border-[var(--bp-border)] hover:border-[var(--bp-blue)]",
  ghost:
    "bg-transparent text-[var(--bp-ink)] border-transparent hover:bg-[var(--bp-blue-tint)]",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1 text-[12px] gap-1.5",
  md: "px-4 py-2 text-[13px] gap-2",
};

/** BluePixel button primitive, ported from the marketing site's `Btn` pattern. */
export function Button({
  kind = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center rounded-[var(--bp-radius-sm)] border font-semibold transition-all duration-[var(--bp-dur)] ease-[var(--bp-ease)] cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${SIZE_CLASSES[size]} ${KIND_CLASSES[kind]} ${className}`}
      {...props}
    />
  );
}

export default Button;
