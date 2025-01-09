import { TableCell, TableRow } from "@/components/ui/table";
import { CrewMember } from "@/types/crew";
import { Checkbox } from "@/components/ui/checkbox";

interface CrewTableRowProps {
  member: CrewMember;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}

export function CrewTableRow({ member, index, isSelected, onSelect }: CrewTableRowProps) {
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
      <TableCell className="text-sm text-muted-foreground">
        {index}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">
            {member.name}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {member.role?.name || 'No role'}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {member.folder?.name || 'No folder'}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {member.email || '-'}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {member.phone || '-'}
      </TableCell>
    </TableRow>
  );
}