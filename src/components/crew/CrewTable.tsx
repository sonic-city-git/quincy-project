import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { CrewMember } from "@/types/crew";
import { RoleTags } from "./RoleTags";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { memo, useCallback, useMemo } from "react";
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
  folderName, 
  isSelected, 
  onSelect,
  style 
}: { 
  crew: CrewMember; 
  folderName: string; 
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
      {folderName === 'Sonic City' && (
        <span className="ml-1">⭐</span>
      )}
    </TableCell>
    <TableCell className="w-[320px]">
      <RoleTags crewMemberId={crew.id} />
    </TableCell>
    <TableCell className="w-[280px] truncate">{crew.email}</TableCell>
    <TableCell className="w-[180px] truncate">{crew.phone}</TableCell>
    <TableCell className="truncate">{folderName}</TableCell>
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
  const { data: folders } = useQuery({
    queryKey: ['crew-folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_folders')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
  });

  const getFolderName = useCallback((folderId: string) => {
    return folders?.find(f => f.id === folderId)?.name || '';
  }, [folders]);

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

  const parentRef = useMemo(() => {
    return {
      current: document.querySelector('.scroll-area-viewport')
    };
  }, []);

  const rowVirtualizer = useVirtualizer({
    count: crewMembers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32, // height of each row
    overscan: 5,
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

  const tableBody = useMemo(() => (
    <TableBody>
      <tr style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        <td>
          <div
            style={{
              position: 'relative',
              height: '100%',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const crew = crewMembers[virtualRow.index];
              return (
                <CrewTableRow
                  key={crew.id}
                  crew={crew}
                  folderName={getFolderName(crew.folder_id)}
                  isSelected={selectedItems.includes(crew.id)}
                  onSelect={onItemSelect}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                />
              );
            })}
          </div>
        </td>
      </tr>
    </TableBody>
  ), [crewMembers, selectedItems, getFolderName, onItemSelect, rowVirtualizer]);

  return (
    <Table>
      {!bodyOnly && tableHeader}
      {!headerOnly && tableBody}
    </Table>
  );
});

CrewTable.displayName = 'CrewTable';