"use client";

import { useEffect, useRef, useState } from "react";

const PAD_X = 18;
const PAD_TOP = 18;
const PAD_BOTTOM = 8;
const LABEL_ROW = 20;

/**
 * Line chart that fills its container (width and height). Give the parent a height — e.g. a flex
 * child with `flex-1` — and it stretches to it; with no parent height it falls back to `minHeight`.
 */
export function TrendSparkline({
  points,
  color = "var(--bp-blue)",
  min = 0,
  max = 100,
  minHeight = 140,
  format = (v: number) => `${v}%`,
}: {
  points: { label: string; value: number }[];
  color?: string;
  min?: number;
  max?: number;
  minHeight?: number;
  format?: (value: number) => string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [points.length]);

  if (points.length === 0) {
    return <div className="text-[12px] text-[var(--bp-ink-soft)]">Sin datos suficientes para mostrar tendencia.</div>;
  }

  const { width } = size;
  const chartHeight = Math.max(size.height - LABEL_ROW, 0);
  const innerWidth = Math.max(width - PAD_X * 2, 0);
  const innerHeight = Math.max(chartHeight - PAD_TOP - PAD_BOTTOM, 0);
  const stepX = points.length > 1 ? innerWidth / (points.length - 1) : 0;
  // A single point sits in the middle instead of against the left edge.
  const coords = points.map((p, i) => ({
    x: points.length > 1 ? PAD_X + i * stepX : width / 2,
    y: PAD_TOP + innerHeight - ((Math.min(Math.max(p.value, min), max) - min) / (max - min)) * innerHeight,
    ...p,
  }));
  const pathD = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  const baseline = PAD_TOP + innerHeight;
  const areaD = `${pathD} L ${coords[coords.length - 1].x.toFixed(1)} ${baseline} L ${coords[0].x.toFixed(1)} ${baseline} Z`;
  const gridValues = [min, (min + max) / 2, max];

  return (
    <div ref={ref} className="relative h-full w-full" style={{ minHeight }}>
      {width > 0 && chartHeight > 0 && (
        <>
          <svg width={width} height={chartHeight} viewBox={`0 0 ${width} ${chartHeight}`} className="absolute left-0 top-0 overflow-visible">
            {gridValues.map((g) => {
              const y = PAD_TOP + innerHeight - ((g - min) / (max - min)) * innerHeight;
              return <line key={g} x1={PAD_X} x2={width - PAD_X} y1={y} y2={y} stroke="var(--bp-border)" strokeDasharray="3 4" strokeWidth={1} />;
            })}
            <path d={areaD} fill={color} opacity={0.08} />
            <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            {coords.map((c) => (
              <g key={c.label}>
                <circle cx={c.x} cy={c.y} r={3.5} fill={color} />
                <text x={c.x} y={Math.max(c.y - 9, 10)} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--bp-ink)">
                  {format(c.value)}
                </text>
              </g>
            ))}
          </svg>
          {coords.map((c) => (
            <span
              key={c.label}
              className="absolute bottom-0 -translate-x-1/2 text-[10px] text-[var(--bp-ink-soft)]"
              style={{ left: c.x }}
            >
              {c.label}
            </span>
          ))}
        </>
      )}
    </div>
  );
}

export default TrendSparkline;
