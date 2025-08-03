import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useCrew } from "@/hooks/useCrew";
import { useCrewRoles } from "@/hooks/useCrewRoles";
import { CrewTable } from "../../crew/CrewTable";
import { useCrewSort } from "../../crew/useCrewSort";
import { Table, TableHeader } from "../../ui/table";
import { CrewTableHeader } from "../../crew/CrewTableHeader";
import { EditMemberDialog } from "../../crew/EditMemberDialog";
import { ResourceFilters } from "../ResourcesHeader";

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
  const [highlightedItem, setHighlightedItem] = useState<string | null>(null);
  const { sortCrew } = useCrewSort();

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Handle scrolling to target item when targetScrollItem is provided
  useEffect(() => {
    if (targetScrollItem && targetScrollItem.id && crew.length > 0) {
      const timer = setTimeout(() => {
        try {
          // Look for the target item in the DOM
          const targetElement = document.querySelector(`[data-crew-id="${targetScrollItem.id}"]`);
          
          if (targetElement) {
            // Highlight the item
            setHighlightedItem(targetScrollItem.id);
            
            // Scroll to the target element
            targetElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest'
            });
            
            // Remove highlight after 3 seconds
            setTimeout(() => {
              setHighlightedItem(null);
            }, 3000);
            
            console.log(`Scrolled to crew member: ${targetScrollItem.id}`);
          } else {
            console.warn(`Could not find crew member with ID: ${targetScrollItem.id}`);
          }
        } catch (error) {
          console.error('Error scrolling to target crew member:', error);
        }
      }, 500); // Wait for render
      
      return () => clearTimeout(timer);
    }
  }, [targetScrollItem, crew]);

  const selectedMember = crew.find(member => member.id === selectedItem);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Apply filters
  const filteredCrew = crew.filter(member => {
    // Search filter
    const matchesSearch = filters.search
      ? member.name.toLowerCase().includes(filters.search.toLowerCase())
      : true;

    // Role filter
    const matchesRole = filters.crewRole && filters.crewRole !== 'all'
      ? member.roles?.includes(filters.crewRole)
      : true;

    return matchesSearch && matchesRole;
  });

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