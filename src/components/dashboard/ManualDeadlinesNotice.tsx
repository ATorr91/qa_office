"use client";

import { useStrategistRecords } from "@/lib/strategistRecords";
import { STRATEGISTS } from "@/lib/strategists";

/** Names of the people whose deadlines are typed by hand because they don't use Jira. */
export function useManualDeadlinePeople(): string[] {
  const { getSources } = useStrategistRecords();
  return STRATEGISTS.filter((s) => !getSources(s.id).jira).map((s) => s.name);
}

function joinNames(names: string[]): string {
  return names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
}

/** The clause everyone should be able to read: whose deadline compliance does not come from Jira. */
export function ManualDeadlinesNotice({ compact = false }: { compact?: boolean }) {
  const names = useManualDeadlinePeople();
  if (names.length === 0) return null;
  const text = (
    <>
      <strong className="text-[var(--bp-ink)]">{joinNames(names)}</strong> {names.length === 1 ? "no usa" : "no usan"} Jira, por eso su cumplimiento de deadlines se captura a mano en Admin
      y no sale de Jira. Es un dato declarado por el equipo, no verificable en Jira.
    </>
  );
  if (compact) return <p className="text-[11px] leading-relaxed text-[var(--bp-ink-soft)]">* {text}</p>;
  return (
    <aside
      role="note"
      className="flex items-start gap-2.5 rounded-[var(--bp-radius-md)] border border-[#b8860b]/30 bg-[#b8860b]/5 px-3.5 py-2.5 text-[12px] leading-relaxed text-[var(--bp-ink-soft)]"
    >
      <span aria-hidden className="mt-px text-[#b8860b]">ⓘ</span>
      <p>
        <span className="font-semibold text-[var(--bp-ink)]">Aviso sobre los deadlines. </span>
        {text}
      </p>
    </aside>
  );
}

export default ManualDeadlinesNotice;
