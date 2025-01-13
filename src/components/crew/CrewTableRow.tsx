import { TableCell, TableRow } from "@/components/ui/table";
import { CrewMember } from "@/types/crew";
import { useCrewRoles } from "@/hooks/useCrewRoles";
import { sortRoles } from "@/utils/roleUtils";

interface CrewTableRowProps {
  member: CrewMember;
  isSelected: boolean;
  onSelect: () => void;
}

export function CrewTableRow({ member, isSelected, onSelect }: CrewTableRowProps) {
  const { roles: allRoles } = useCrewRoles();
  
  const memberRoles = sortRoles(
    allRoles.filter(role => member.roles?.includes(role.id))
  );

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Prevent text selection
    window.getSelection()?.removeAllRanges();
    onSelect();
  };

  return (
    <TableRow 
      className={`group hover:bg-zinc-800/50 cursor-pointer select-none ${
        isSelected ? 'bg-zinc-800/75' : ''
      }`}
      onDoubleClick={handleDoubleClick}
    >
      <TableCell>
        <div className="text-sm font-medium truncate max-w-[200px]">
          {member.name}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          {memberRoles.map((role) => (
            <div
              key={role.id}
              className="text-xs px-2 py-1 rounded text-white whitespace-nowrap"
              style={{ backgroundColor: role.color }}
            >
              {role.name}
            </div>
          ))}
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
    </TableRow>
  );
}