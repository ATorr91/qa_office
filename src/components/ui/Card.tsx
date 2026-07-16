import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] bg-[var(--bp-surface)] shadow-[var(--bp-shadow-sm)] ${className}`}
      {...props}
    />
  );
}

export default Card;
