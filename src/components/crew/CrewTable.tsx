import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { CrewMember } from "@/types/crew";
import { RoleTags } from "./RoleTags";

interface CrewTableProps {
  crewMembers: CrewMember[];
  selectedItems: string[];
  onItemSelect: (id: string) => void;
}

export function CrewTable({ crewMembers, selectedItems, onItemSelect }: CrewTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent border-b border-zinc-800/50">
          <TableHead className="w-12">
            <Checkbox />
          </TableHead>
          <TableHead className="whitespace-nowrap">Name</TableHead>
          <TableHead className="whitespace-nowrap">Role</TableHead>
          <TableHead className="whitespace-nowrap">Email</TableHead>
          <TableHead className="whitespace-nowrap">Phone</TableHead>
          <TableHead className="whitespace-nowrap">Folder</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {crewMembers.map((crew) => (
          <TableRow key={crew.id} className="h-8 hover:bg-zinc-800/50 border-b border-zinc-800/50">
            <TableCell className="w-12">
              <Checkbox 
                checked={selectedItems.includes(crew.id)}
                onCheckedChange={() => onItemSelect(crew.id)}
              />
            </TableCell>
            <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">{crew.name}</TableCell>
            <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">
              <RoleTags role={crew.role} />
            </TableCell>
            <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">{crew.email}</TableCell>
            <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">{crew.phone}</TableCell>
            <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">{crew.folder}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}