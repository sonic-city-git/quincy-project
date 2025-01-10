import { TableCell, TableRow } from "@/components/ui/table";
import { CrewMember } from "@/types/crew";
import { Checkbox } from "@/components/ui/checkbox";

interface CrewTableRowProps {
  member: CrewMember;
  isSelected: boolean;
  onSelect: () => void;
}

export function CrewTableRow({ member, isSelected, onSelect }: CrewTableRowProps) {
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
    </TableRow>
  );
}