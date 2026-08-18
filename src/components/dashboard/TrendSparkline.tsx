export function TrendSparkline({
  points,
  width = 220,
  height = 64,
  color = "var(--bp-blue)",
  min = 0,
  max = 100,
}: {
  points: { label: string; value: number }[];
  width?: number;
  height?: number;
  color?: string;
  min?: number;
  max?: number;
}) {
  if (points.length === 0) {
    return <div className="text-[12px] text-[var(--bp-ink-soft)]">Sin datos suficientes para mostrar tendencia.</div>;
  }

  const pad = 6;
  const innerWidth = width - pad * 2;
  const innerHeight = height - pad * 2;
  const stepX = points.length > 1 ? innerWidth / (points.length - 1) : 0;
  const coords = points.map((p, i) => ({
    x: pad + i * stepX,
    y: pad + innerHeight - ((p.value - min) / (max - min)) * innerHeight,
    ...p,
  }));
  const pathD = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  const areaD = `${pathD} L ${coords[coords.length - 1].x.toFixed(1)} ${height - pad} L ${coords[0].x.toFixed(1)} ${height - pad} Z`;

  return (
    <div>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <path d={areaD} fill={color} opacity={0.08} />
        <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c) => (
          <circle key={c.label} cx={c.x} cy={c.y} r={3} fill={color} />
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-[var(--bp-ink-soft)]" style={{ width }}>
        {points.map((p) => (
          <span key={p.label}>{p.label}</span>
        ))}
      </div>
    </div>
  );
}

export default TrendSparkline;
