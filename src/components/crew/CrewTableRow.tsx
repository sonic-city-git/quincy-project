import { TableCell, TableRow } from "@/components/ui/table";
import { CrewMember } from "@/types/crew";
import { Badge } from "../ui/badge";
import { useCrewRoles } from "@/hooks/useCrewRoles";

interface CrewTableRowProps {
  member: CrewMember;
  isSelected: boolean;
  onSelect: () => void;
}

export function CrewTableRow({ member, isSelected, onSelect }: CrewTableRowProps) {
  const { roles: allRoles } = useCrewRoles();
  
  const memberRoles = allRoles.filter(role => 
    member.roles?.includes(role.name)
  );

  return (
    <TableRow 
      className={`hover:bg-zinc-800/50 cursor-pointer select-none ${
        isSelected ? 'bg-zinc-800/75' : ''
      }`}
      onDoubleClick={onSelect}
    >
      <TableCell className="w-[300px]">
        <div className="text-sm font-medium truncate">
          {member.name}
        </div>
      </TableCell>
      <TableCell className="w-[200px]">
        <div className="flex items-center gap-1 overflow-x-auto">
          {memberRoles.map((role) => (
            <Badge
              key={role.id}
              style={{ backgroundColor: role.color }}
              className="text-white text-xs whitespace-nowrap"
            >
              {role.name}
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell w-[200px]">
        <span className="text-sm text-muted-foreground truncate block">
          {member.email || '-'}
        </span>
      </TableCell>
      <TableCell className="hidden md:table-cell w-[100px]">
        <span className="text-sm text-muted-foreground truncate block">
          {member.phone || '-'}
        </span>
      </TableCell>
    </TableRow>
  );
}