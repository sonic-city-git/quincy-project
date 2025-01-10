import { TableCell, TableRow } from "@/components/ui/table";
import { CrewMember } from "@/types/crew";
import { Checkbox } from "@/components/ui/checkbox";
import { useCrewRoles } from "@/hooks/useCrewRoles";

interface CrewTableRowProps {
  member: CrewMember;
  isSelected: boolean;
  onSelect: () => void;
}

export function CrewTableRow({ member, isSelected, onSelect }: CrewTableRowProps) {
  const { roles: allRoles } = useCrewRoles();
  
  const memberRoles = allRoles.filter(role => 
    member.roles?.includes(role.id)
  );

  return (
    <TableRow 
      className={`group hover:bg-zinc-800/50 ${
        isSelected ? 'bg-zinc-800/75' : ''
      }`}
    >
      <TableCell className="w-12">
        <Checkbox 
          checked={isSelected}
          onCheckedChange={onSelect}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium truncate max-w-[200px]">
            {member.name}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        <span className="truncate block max-w-[200px]">
          {member.email || '-'}
        </span>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        <span className="truncate block max-w-[150px]">
          {member.phone || '-'}
        </span>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        <span className="truncate block max-w-[150px]">
          {member.folderName || '-'}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {memberRoles.map((role) => (
            <div
              key={role.id}
              className="text-xs px-2 py-1 rounded text-white"
              style={{ backgroundColor: role.color }}
            >
              {role.name}
            </div>
          ))}
        </div>
      </TableCell>
    </TableRow>
  );
}