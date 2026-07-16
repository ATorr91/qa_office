const PALETTE = [
  ["var(--bp-blue)", "var(--bp-navy)"],
  ["var(--bp-magenta)", "var(--bp-purple)"],
  ["var(--bp-purple)", "var(--bp-navy)"],
  ["var(--bp-green)", "var(--bp-blue)"],
  ["var(--bp-cyan)", "var(--bp-blue-600)"],
];

const SIZE_CLASSES = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-14 w-14 text-lg",
};

function hashName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return hash;
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

/** Deterministic gradient avatar used as a profile-picture stand-in (no photo upload in this demo). */
export function Avatar({
  name,
  size = "md",
  className = "",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [from, to] = PALETTE[hashName(name) % PALETTE.length];
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${SIZE_CLASSES[size]} ${className}`}
      style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
      title={name}
    >
      {initialsOf(name)}
    </span>
  );
}

export default Avatar;
