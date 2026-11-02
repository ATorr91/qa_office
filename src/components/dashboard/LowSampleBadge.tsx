import Badge from "@/components/ui/Badge";

/** Below this many tickets with a due date, a deadline percentage moves a lot with one late batch, so it is flagged. */
export const MIN_RELIABLE_DEADLINES = 20;

/** "Pocos datos" pill for a Jira deadline rate built on few tickets; renders nothing when there is no sample or it is large enough. */
export function LowSampleBadge({ assigned }: { assigned: number }) {
  if (assigned <= 0 || assigned >= MIN_RELIABLE_DEADLINES) return null;
  return (
    <span title={`Solo ${assigned} incidencias con fecha límite en el periodo (menos de ${MIN_RELIABLE_DEADLINES}): un lote tardío cambia mucho el porcentaje.`}>
      <Badge color="warning" dot={false} className="ml-1.5 !px-1.5 !py-0 !text-[10px]">
        pocos datos
      </Badge>
    </span>
  );
}

export default LowSampleBadge;
