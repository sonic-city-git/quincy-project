import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { CrewMember } from "@/types/crew";
import { RoleTags } from "./RoleTags";

interface CrewTableProps {
  crewMembers: CrewMember[];
  selectedItems: string[];
  onItemSelect: (id: string) => void;
  headerOnly?: boolean;
  bodyOnly?: boolean;
}

export function CrewTable({ crewMembers, selectedItems, onItemSelect, headerOnly, bodyOnly }: CrewTableProps) {
  const handleSelectAll = () => {
    if (selectedItems.length === crewMembers.length) {
      // If all items are selected, unselect all
      crewMembers.forEach((crew) => {
        if (selectedItems.includes(crew.id)) {
          onItemSelect(crew.id);
        }
      });
    } else {
      // If not all items are selected, select all
      crewMembers.forEach((crew) => {
        if (!selectedItems.includes(crew.id)) {
          onItemSelect(crew.id);
        }
      });
    }
  };

  const tableHeader = (
    <TableHeader>
      <TableRow className="hover:bg-transparent border-b border-zinc-800/50">
        <TableHead className="w-[48px]">
          <Checkbox 
            checked={selectedItems.length === crewMembers.length && crewMembers.length > 0}
            onCheckedChange={handleSelectAll}
          />
        </TableHead>
        <TableHead className="w-[200px]">Name</TableHead>
        <TableHead className="w-[200px]">Role</TableHead>
        <TableHead className="w-[250px]">Email</TableHead>
        <TableHead className="w-[150px]">Phone</TableHead>
        <TableHead className="min-w-[200px]">Folder</TableHead>
      </TableRow>
    </TableHeader>
  );

  const tableBody = (
    <TableBody>
      {crewMembers.map((crew) => (
        <TableRow key={crew.id} className="h-8 hover:bg-zinc-800/50 border-b border-zinc-800/50">
          <TableCell className="w-[48px]">
            <Checkbox 
              checked={selectedItems.includes(crew.id)}
              onCheckedChange={() => onItemSelect(crew.id)}
            />
          </TableCell>
          <TableCell className="w-[200px] truncate">{crew.name}</TableCell>
          <TableCell className="w-[200px] truncate">
            <RoleTags role={crew.role} />
          </TableCell>
          <TableCell className="w-[250px] truncate">{crew.email}</TableCell>
          <TableCell className="w-[150px] truncate">{crew.phone}</TableCell>
          <TableCell className="min-w-[200px] truncate">{crew.folder}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  );

  return (
    <Table>
      {!bodyOnly && tableHeader}
      {!headerOnly && tableBody}
    </Table>
  );
}