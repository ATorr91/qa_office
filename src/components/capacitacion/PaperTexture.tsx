export default function PaperTexture({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ mixBlendMode: "multiply" }}
      aria-hidden
    >
      <svg width="100%" height="100%">
        <filter id="paper-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves={3}
            seed={7}
            stitchTiles="stitch"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#paper-noise)" />
      </svg>
    </div>
  );
}
