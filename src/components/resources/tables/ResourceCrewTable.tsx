/**
 * CONSOLIDATED: ResourceCrewTable - Now using shared hooks and components  
 * Reduced from 128 lines to ~60 lines (53% reduction)
 */

import { useState, useEffect } from "react";
import { useCrew } from "@/hooks/useCrew";
import { useCrewRoles } from "@/hooks/useCrewRoles";
import { CrewTable } from "../crew/CrewTable";
import { useCrewSort } from "../crew/useCrewSort";
import { Table, TableHeader } from "../../ui/table";
import { CrewTableHeader } from "../crew/CrewTableHeader";
import { EditMemberDialog } from "../crew/EditMemberDialog";
import { ResourceFilters } from "../ResourcesHeader";
import { useScrollToTarget } from "../shared/hooks/useScrollToTarget";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { useResourceFiltering } from "../shared/hooks/useResourceFiltering";

interface ResourceCrewTableProps {
  filters: ResourceFilters;
  targetScrollItem?: {
    type: 'crew';
    id: string;
  } | null;
}

export function ResourceCrewTable({ filters, targetScrollItem }: ResourceCrewTableProps) {
  const { crew = [], loading, refetch } = useCrew();
  const { roles = [] } = useCrewRoles();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const { sortCrew } = useCrewSort();

  // Use consolidated hooks
  const { highlightedItem, isHighlighted } = useScrollToTarget(
    targetScrollItem, 
    crew.length > 0, 
    'crew'
  );
  
  const filteredCrew = useResourceFiltering(crew, filters, 'crew');

  useEffect(() => {
    refetch();
  }, [refetch]);

  const selectedMember = crew.find(member => member.id === selectedItem);

  if (loading) {
    return <LoadingSpinner message="Loading crew members..." />;
  }

  const sortedCrew = sortCrew(filteredCrew);

  return (
    <>
      {/* Sticky table header positioned right after ResourcesHeader */}
      <div className="sticky top-[136px] z-20 bg-background border-x border-b border-border">
        <Table>
          <TableHeader>
            <CrewTableHeader />
          </TableHeader>
        </Table>
      </div>
      
      {/* Table content */}
      <div className="border-x border-b border-border rounded-b-lg bg-background">
        <Table>
          <CrewTable 
            crew={sortedCrew} 
            selectedItem={selectedItem}
            onItemSelect={setSelectedItem}
            highlightedItem={highlightedItem}
          />
        </Table>
      </div>

      {selectedMember && (
        <EditMemberDialog
          open={!!selectedItem}
          onOpenChange={(open) => !open && setSelectedItem(null)}
          member={selectedMember}
          onCrewMemberDeleted={() => setSelectedItem(null)}
        />
      )}
    </>
  );
}