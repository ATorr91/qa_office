import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import type { TeamMember } from "@/lib/projects";

export function TeamCard({ team }: { team: TeamMember[] }) {
  return (
    <Card className="p-4">
      <h2 className="text-[13px] font-semibold text-[var(--bp-ink)]">Equipo asignado</h2>
      <ul className="mt-3 flex flex-col gap-3">
        {team.map((member) => (
          <li key={member.name} className="flex items-center gap-3">
            <Avatar name={member.name} size="lg" />
            <div>
              <div className="text-sm font-semibold text-[var(--bp-ink)]">{member.name}</div>
              <div className="text-[12px] text-[var(--bp-ink-soft)]">{member.role}</div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default TeamCard;
