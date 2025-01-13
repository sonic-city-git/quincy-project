import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CrewTableRow } from "./CrewTableRow";
import { CrewMember } from "@/types/crew";

interface CrewTableProps {
  crew: CrewMember[];
}

export function CrewTable({ crew }: CrewTableProps) {
  return (
    <Table>
      <TableHeader className="bg-zinc-900/50 border-b border-zinc-800">
        <TableRow>
          <TableHead className="w-24 whitespace-nowrap">Member #</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="w-[250px]">Folder ↓</TableHead>
          <TableHead>Roles</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {crew.map((member, index) => (
          <CrewTableRow
            key={member.id}
            member={member}
            index={index + 1}
          />
        ))}
      </TableBody>
    </Table>
  );
}