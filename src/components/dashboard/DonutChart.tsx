export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  segments,
  size = 120,
  strokeWidth = 16,
  centerLabel,
  centerValue,
}: {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = segments.reduce((acc, s) => acc + s.value, 0) || 1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Each segment starts where the previous one ended.
  const offsets = segments.reduce<number[]>((acc, s, i) => [...acc, i === 0 ? 0 : acc[i - 1] + (segments[i - 1].value / total) * circumference], []);

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--bp-surface-alt)" strokeWidth={strokeWidth} />
          {segments.map((s, i) => {
            const frac = s.value / total;
            const dash = frac * circumference;
            const gap = circumference - dash;
            return (
              <circle
                key={s.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-offsets[i]}
              />
            );
          })}
        </svg>
        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && <span className="text-lg font-bold text-[var(--bp-ink)]">{centerValue}</span>}
            {centerLabel && <span className="text-center text-[10px] leading-tight text-[var(--bp-ink-soft)]">{centerLabel}</span>}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-[12px]">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-[var(--bp-ink)]">{s.label}</span>
            <span className="font-mono text-[var(--bp-ink-soft)]">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DonutChart;
