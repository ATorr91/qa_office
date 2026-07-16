import type { ReactNode } from "react";
import type { Project } from "@/lib/projects";

const CATEGORY_STYLE: Record<Project["category"], { from: string; to: string }> = {
  Web: { from: "var(--bp-blue)", to: "var(--bp-navy)" },
  Móvil: { from: "var(--bp-magenta)", to: "var(--bp-purple)" },
  API: { from: "var(--bp-purple)", to: "var(--bp-navy)" },
  Interno: { from: "var(--bp-green)", to: "var(--bp-blue)" },
  Cloud: { from: "var(--bp-cyan)", to: "var(--bp-blue-600)" },
};

const CATEGORY_ICON: Record<Project["category"], ReactNode> = {
  Web: (
    <path
      d="M2 8h12M8 2a9 9 0 0 1 0 12M8 2a9 9 0 0 0 0 12M2 8a6 6 0 0 0 12 0 6 6 0 0 0-12 0Z"
      stroke="white"
      strokeWidth="1.1"
      fill="none"
      strokeLinecap="round"
    />
  ),
  Móvil: (
    <rect x="5" y="1.5" width="6" height="13" rx="1.2" stroke="white" strokeWidth="1.1" fill="none" />
  ),
  API: (
    <path
      d="M4 4h3v3H4zM9 9h3v3H9zM6.5 6.5 9.5 9.5"
      stroke="white"
      strokeWidth="1.1"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  Interno: (
    <path
      d="M3 14V3h6v11M3 14h10M9 14V7h4v7M5 5.5h1M5 8h1M5 10.5h1"
      stroke="white"
      strokeWidth="1.1"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  Cloud: (
    <path
      d="M4.5 11.5a2.8 2.8 0 0 1-.4-5.57 3.4 3.4 0 0 1 6.6-1.2 2.6 2.6 0 0 1 2.8 2.6c0 .13 0 .26-.02.38A2.3 2.3 0 0 1 12.5 11.5h-8Z"
      stroke="white"
      strokeWidth="1.1"
      fill="none"
      strokeLinejoin="round"
    />
  ),
};

export function ProjectThumbnail({
  category,
  className = "",
}: {
  category: Project["category"];
  className?: string;
}) {
  const { from, to } = CATEGORY_STYLE[category];
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-[var(--bp-radius-md)] ${className}`}
      style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
      aria-hidden
    >
      <span className="absolute right-1 top-1 h-1.5 w-1.5 bg-white/25" />
      <svg viewBox="0 0 16 16" className="h-5 w-5">
        {CATEGORY_ICON[category]}
      </svg>
    </div>
  );
}

export default ProjectThumbnail;
