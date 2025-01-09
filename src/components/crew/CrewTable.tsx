import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { CrewMember } from "@/types/crew";
import { RoleTags } from "./RoleTags";
import { memo, useCallback } from "react";

interface CrewTableProps {
  crewMembers: CrewMember[];
  selectedItems: string[];
  onItemSelect: (id: string) => void;
  headerOnly?: boolean;
  bodyOnly?: boolean;
}

// Memoized table row component to prevent unnecessary re-renders
const CrewTableRow = memo(({ 
  crew, 
  isSelected, 
  onSelect 
}: { 
  crew: CrewMember; 
  isSelected: boolean;
  onSelect: (id: string) => void;
}) => (
  <TableRow className="h-8 hover:bg-zinc-800/50 border-b border-zinc-800/50">
    <TableCell className="w-[48px]">
      <Checkbox 
        checked={isSelected}
        onCheckedChange={() => onSelect(crew.id)}
      />
    </TableCell>
    <TableCell className="w-[240px] truncate">
      {crew.name}
      {crew.crew_folder?.name === 'Sonic City' && (
        <span className="ml-1">⭐</span>
      )}
    </TableCell>
    <TableCell className="w-[320px]">
      <RoleTags roles={crew.roles || []} />
    </TableCell>
    <TableCell className="w-[280px] truncate">{crew.email}</TableCell>
    <TableCell className="w-[180px] truncate">{crew.phone}</TableCell>
    <TableCell className="truncate">
      {crew.crew_folder?.name || ''}
    </TableCell>
  </TableRow>
));
CrewTableRow.displayName = 'CrewTableRow';

export const CrewTable = memo(({ 
  crewMembers, 
  selectedItems, 
  onItemSelect, 
  headerOnly, 
  bodyOnly 
}: CrewTableProps) => {
  const handleSelectAll = useCallback(() => {
    if (selectedItems.length === crewMembers.length) {
      crewMembers.forEach((crew) => {
        if (selectedItems.includes(crew.id)) {
          onItemSelect(crew.id);
        }
      });
    } else {
      crewMembers.forEach((crew) => {
        if (!selectedItems.includes(crew.id)) {
          onItemSelect(crew.id);
        }
      });
    }
  }, [crewMembers, selectedItems, onItemSelect]);

  const tableHeader = (
    <TableHeader>
      <TableRow className="hover:bg-transparent border-b border-zinc-800/50">
        <TableHead className="w-[48px]">
          <Checkbox 
            checked={selectedItems.length === crewMembers.length && crewMembers.length > 0}
            onCheckedChange={handleSelectAll}
          />
        </TableHead>
        <TableHead className="w-[240px]">Name</TableHead>
        <TableHead className="w-[320px]">Role</TableHead>
        <TableHead className="w-[280px]">Email</TableHead>
        <TableHead className="w-[180px]">Phone</TableHead>
        <TableHead>Folder</TableHead>
      </TableRow>
    </TableHeader>
  );

  const tableBody = (
    <TableBody>
      {crewMembers.map((crew) => (
        <CrewTableRow
          key={crew.id}
          crew={crew}
          isSelected={selectedItems.includes(crew.id)}
          onSelect={onItemSelect}
        />
      ))}
    </TableBody>
  );

  return (
    <Table>
      {!bodyOnly && tableHeader}
      {!headerOnly && tableBody}
    </Table>
  );
});

CrewTable.displayName = 'CrewTable';