import Image from "next/image";
import type { Strategist } from "@/lib/strategists";

export function StrategistAvatar({ strategist, size = 28 }: { strategist: Strategist; size?: number }) {
  const words = strategist.name.split(" ").filter(Boolean);
  // One-word names (like "Cano") use their first two letters so the avatar is not a lone initial.
  const initials = (words.length > 1 ? words.slice(0, 2).map((w) => w[0]).join("") : words[0].slice(0, 2)).toUpperCase();

  return (
    <div className="flex items-center gap-2.5">
      {strategist.photo ? (
        <Image
          src={strategist.photo}
          alt={`Foto de ${strategist.name}`}
          width={size * 2}
          height={size * 2}
          loading="eager"
          className="shrink-0 rounded-full object-cover"
          style={{ width: size, height: size }}
        />
      ) : (
        <span
          className="flex shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
          style={{ width: size, height: size, backgroundColor: strategist.avatarColor, fontSize: size >= 44 ? 16 : 11 }}
        >
          {initials}
        </span>
      )}
      <div className="min-w-0">
        <div className="truncate text-[13px] font-semibold text-[var(--bp-ink)]">{strategist.name}</div>
        <div className="truncate text-[11px] text-[var(--bp-ink-soft)]">{strategist.role}</div>
      </div>
    </div>
  );
}

export default StrategistAvatar;
