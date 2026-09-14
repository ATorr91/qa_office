const PATHS = {
  tl: "M0 11.5V0.5H11.5",
  tr: "M0.5 0.5H11.5V11.5",
  bl: "M0 0.5V11.5H11.5",
  br: "M0.5 11.5H11.5V0.5",
} as const;

export default function CornerBracket({
  position,
  className = "",
}: {
  position: keyof typeof PATHS;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={className}
      style={{ width: "var(--corner)", height: "var(--corner)" }}
      fill="none"
    >
      <path
        className="corner-bracket-path"
        d={PATHS[position]}
        stroke="currentColor"
        strokeWidth={1.5}
      />
    </svg>
  );
}
