import { TableBody } from "@/components/ui/table";
import { CrewTableRow } from "./CrewTableRow";
import { CrewMember } from "@/types/crew";

interface CrewTableProps {
  crew: CrewMember[];
  selectedItem: string | null;
  onItemSelect: (id: string) => void;
}

export function CrewTable({ crew, selectedItem, onItemSelect }: CrewTableProps) {
  return (
    <TableBody>
      {crew.map((member) => (
        <CrewTableRow
          key={member.id}
          member={member}
          isSelected={selectedItem === member.id}
          onSelect={() => onItemSelect(member.id)}
        />
      ))}
    </TableBody>
  );
}