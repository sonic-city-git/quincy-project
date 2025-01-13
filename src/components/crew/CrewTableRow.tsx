import { TableCell, TableRow } from "@/components/ui/table";
import { CrewMember } from "@/types/crew";
import { Badge } from "../ui/badge";

interface CrewTableRowProps {
  member: CrewMember;
  isSelected: boolean;
  onSelect: () => void;
}

export function CrewTableRow({ member, isSelected, onSelect }: CrewTableRowProps) {
  return (
    <TableRow 
      className={`group hover:bg-zinc-800/50 cursor-pointer select-none ${
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
        <div className="flex flex-wrap gap-1">
          {member.roles?.map((role) => (
            <Badge
              key={role.id}
              className={`bg-${role.color}-500 bg-opacity-10 text-${role.color}-500 text-xs`}
            >
              {role.name}
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell className="w-[200px]">
        <span className="text-sm text-muted-foreground truncate block">
          {member.email || '-'}
        </span>
      </TableCell>
      <TableCell className="w-[150px]">
        <span className="text-sm text-muted-foreground truncate block">
          {member.phone || '-'}
        </span>
      </TableCell>
      <TableCell className="w-[150px]">
        <span className="text-sm text-muted-foreground truncate block">
          {member.folder?.name || '-'}
        </span>
      </TableCell>
    </TableRow>
  );
}