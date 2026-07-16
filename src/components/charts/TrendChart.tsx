"use client";

import { useId, useState } from "react";
import type { TrendPoint } from "@/lib/projects";

const WIDTH = 560;
const HEIGHT = 150;
const PADDING = 20;

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const gradientId = useId();
  const [hovered, setHovered] = useState<number | null>(null);

  const maxRate = 100;
  const innerWidth = WIDTH - PADDING * 2;
  const innerHeight = HEIGHT - PADDING * 2;

  const points = data.map((d, i) => {
    const x = PADDING + (i / Math.max(1, data.length - 1)) * innerWidth;
    const y = PADDING + innerHeight - (d.passRate / maxRate) * innerHeight;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${PADDING + innerHeight} L ${points[0].x} ${PADDING + innerHeight} Z`;

  const active = hovered !== null ? points[hovered] : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Tendencia de tasa de aprobación">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--bp-blue)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--bp-blue)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 25, 50, 75, 100].map((tick) => {
          const y = PADDING + innerHeight - (tick / maxRate) * innerHeight;
          return (
            <line
              key={tick}
              x1={PADDING}
              x2={WIDTH - PADDING}
              y1={y}
              y2={y}
              stroke="var(--bp-border)"
              strokeWidth={1}
            />
          );
        })}

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path d={linePath} fill="none" stroke="var(--bp-blue)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, i) => (
          <g key={p.label}>
            <circle
              cx={p.x}
              cy={p.y}
              r={hovered === i ? 6 : 4}
              fill="var(--bp-blue)"
              stroke="white"
              strokeWidth={2}
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
            <text x={p.x} y={HEIGHT - 4} textAnchor="middle" fontSize={10} fill="var(--bp-ink-soft)">
              {p.label}
            </text>
          </g>
        ))}
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-[var(--bp-radius-sm)] bg-[var(--bp-ink)] px-2 py-1 font-mono text-[11px] text-white shadow-[var(--bp-shadow-md)]"
          style={{ left: `${(active.x / WIDTH) * 100}%`, top: `${(active.y / HEIGHT) * 100}%` }}
        >
          <div className="font-semibold">{active.passRate}% aprobación</div>
          <div className="text-white/70">{active.testsExecuted} pruebas</div>
        </div>
      )}
    </div>
  );
}

export default TrendChart;
