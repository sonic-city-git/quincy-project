import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CrewTableRow } from "./CrewTableRow";
import { CrewMember } from "@/types/crew";

interface CrewTableProps {
  crew: CrewMember[];
  selectedItem: string | null;
  onItemSelect: (id: string) => void;
}

export function CrewTable({ crew, selectedItem, onItemSelect }: CrewTableProps) {
  return (
    <Table>
      <TableHeader className="bg-zinc-900/50 border-b border-zinc-800">
        <TableRow>
          <TableHead className="w-12"></TableHead>
          <TableHead className="min-w-[300px]">Name / Roles</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Folder</TableHead>
        </TableRow>
      </TableHeader>
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
    </Table>
  );
}