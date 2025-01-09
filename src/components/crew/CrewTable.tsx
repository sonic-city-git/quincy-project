import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { CrewMember } from "@/types/crew";
import { RoleTags } from "./RoleTags";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

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
  onSelect,
  style 
}: { 
  crew: CrewMember; 
  isSelected: boolean;
  onSelect: (id: string) => void;
  style?: React.CSSProperties;
}) => (
  <TableRow 
    className="h-8 hover:bg-zinc-800/50 border-b border-zinc-800/50"
    style={style}
  >
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
    <TableCell className="truncate">{crew.crew_folder?.name || ''}</TableCell>
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

  // Create a ref for the scroll container
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [isScrollContainerReady, setIsScrollContainerReady] = useState(false);

  // Effect to find and set the scroll container reference
  useEffect(() => {
    const container = document.querySelector('.scroll-area-viewport');
    if (container) {
      scrollContainerRef.current = container as HTMLDivElement;
      setIsScrollContainerReady(true);
    }
  }, []);

  const rowVirtualizer = useVirtualizer({
    count: crewMembers.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 32,
    overscan: 5,
    enabled: isScrollContainerReady,
  });

  console.log('CrewTable rendering with:', { 
    crewMembersLength: crewMembers.length, 
    headerOnly, 
    bodyOnly,
    isScrollContainerReady 
  });

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