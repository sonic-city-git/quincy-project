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
  
  // Get the full role objects for the member's role IDs
  const memberRoles = allRoles.filter(role => 
    member.roles?.includes(role.id)
  );

  return (
    <TableRow 
      className={`group hover:bg-zinc-800/50 cursor-pointer select-none ${
        isSelected ? 'bg-zinc-800/75' : ''
      }`}
      onDoubleClick={onSelect}
    >
      <TableCell className="w-[25%] min-w-[200px]">
        <div className="text-sm font-medium truncate">
          {member.name}
        </div>
      </TableCell>
      <TableCell className="w-[25%] min-w-[150px]">
        <div className="flex flex-wrap gap-1">
          {memberRoles.map((role) => (
            <Badge
              key={role.id}
              className={`bg-${role.color}-500 bg-opacity-10 text-${role.color}-500 text-xs`}
            >
              {role.name}
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell className="w-[20%] min-w-[150px]">
        <span className="text-sm text-muted-foreground truncate block">
          {member.email || '-'}
        </span>
      </TableCell>
      <TableCell className="w-[15%] min-w-[120px]">
        <span className="text-sm text-muted-foreground truncate block">
          {member.phone || '-'}
        </span>
      </TableCell>
      <TableCell className="w-[15%] min-w-[120px]">
        <span className="text-sm text-muted-foreground truncate block">
          {member.folderName || '-'}
        </span>
      </TableCell>
    </TableRow>
  );
}