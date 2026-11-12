import { LIGHT_LABEL, type Light } from "@/lib/projectHealth";

const COLOR: Record<Light, string> = {
  verde: "var(--bp-green)",
  amarillo: "#d4a017",
  rojo: "var(--bp-danger)",
  gris: "var(--bp-border)",
};

/** A traffic-light dot. The color is never the only signal: the label is always readable by assistive tech and on hover. */
export function HealthDot({ light, reason, label, size = 12 }: { light: Light; reason?: string; label?: string; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5" data-tip={reason ? `${LIGHT_LABEL[light]}: ${reason}` : LIGHT_LABEL[light]}>
      <span aria-hidden className={`inline-block shrink-0 rounded-full ${light === "rojo" ? "bp-pulse" : ""}`} style={{ width: size, height: size, backgroundColor: COLOR[light] }} />
      <span className={label ? "text-[12px] font-medium text-[var(--bp-ink)]" : "sr-only"}>
        {label ? `${label}: ` : ""}
        {LIGHT_LABEL[light]}
      </span>
    </span>
  );
}

export default HealthDot;
