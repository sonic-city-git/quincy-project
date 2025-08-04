/**
 * CONSOLIDATED: ResourceCrewTable with priority folder organization
 * Features: Sonic City → Associates → Freelancers sorting, collapsible structure
 */

import { useState, useEffect } from "react";
import { useCrew } from "@/hooks/useCrew";
import { useCrewRoles } from "@/hooks/useCrewRoles";
import { CrewTable } from "../crew/CrewTable";
import { useCrewSort } from "../crew/useCrewSort";

import { CrewTableHeader } from "../crew/CrewTableHeader";
import { EditMemberDialog } from "../crew/EditMemberDialog";
import { ResourceFilters } from "../ResourcesHeader";
import { useScrollToTarget } from "../shared/hooks/useScrollToTarget";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { useResourceFiltering } from "../shared/hooks/useResourceFiltering";
import { COMPONENT_CLASSES, cn } from "@/design-system";
import { Users, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { usePersistentExpandedGroups } from "@/hooks/usePersistentExpandedGroups";
import { useCrewFolders } from "@/hooks/useCrewFolders";
import { sortCrewFolderNames } from "@/utils/crewFolderSort";

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
  const { folders = [] } = useCrewFolders();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const { sortCrew } = useCrewSort();
  
  // Persistent expansion state for folders (with Cmd+click support like planner)
  const { expandedGroups, toggleGroup } = usePersistentExpandedGroups('resourceCrewExpandedGroups');

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
  
  // Group crew by actual folders (like equipment)
  const groupedCrew = sortedCrew.reduce((acc, member) => {
    const folder = folders.find(f => f.id === member.folder_id);
    const folderName = folder ? folder.name : 'Uncategorized';
    
    if (!acc[folderName]) {
      acc[folderName] = [];
    }
    acc[folderName].push(member);
    return acc;
  }, {} as Record<string, typeof sortedCrew>);
  
  // Sort folders with Sonic City → Associates → Freelancers priority
  const sortedFolderNames = sortCrewFolderNames(Object.keys(groupedCrew));

  if (sortedCrew.length === 0) {
    const getEmptyMessage = () => {
      if (filters.search) {
        return 'No crew members match your search';
      }
      if (filters.crewRole) {
        return 'No crew members found for this role';
      }
      return 'No crew members found. Add your first crew member to get started!';
    };

    return (
      <div className="w-full">
        {/* Sticky table header */}
        <div className={cn("sticky top-[124px] z-30", COMPONENT_CLASSES.table.container)}>
          <CrewTableHeader />
        </div>

        {/* Empty state content */}
        <div className={cn("rounded-b-lg", COMPONENT_CLASSES.table.container)}>
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">{getEmptyMessage()}</p>
            {!filters.search && !filters.crewRole && (
              <p className="text-sm">Crew members help you organize roles and responsibilities for your projects.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Sticky table header positioned right after ResourcesHeader */}
      <div className={cn("sticky top-[124px] z-30", COMPONENT_CLASSES.table.container)}>
        <CrewTableHeader />
      </div>
      
      {/* Table content */}
      <div className={cn("rounded-b-lg", COMPONENT_CLASSES.table.container)}>
        <div className="divide-y divide-border">
          {sortedFolderNames.map((folderName) => {
            const folderCrew = groupedCrew[folderName];
            if (!folderCrew) return null;
            
            const isExpanded = expandedGroups.has(folderName);
            
            return (
              <Collapsible key={folderName} open={isExpanded}>
                <CollapsibleTrigger 
                  className="w-full group/folder"
                  onClick={(e) => {
                    // Cmd+click to expand all subfolders (for future subfolder support)
                    const expandAllSubfolders = e.metaKey || e.ctrlKey;
                    toggleGroup(folderName, expandAllSubfolders);
                  }}
                >
                  <div 
                    className={cn(
                      "grid grid-cols-[2fr_200px_120px] sm:grid-cols-[2fr_200px_160px_120px] gap-3 sm:gap-4 bg-muted/50 hover:bg-muted transition-colors py-2 font-medium text-sm text-muted-foreground",
                      "p-3 sm:p-4"
                    )}
                  >
                    {/* Name column */}
                    <div className="flex items-center gap-2 min-w-0">
                      <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/folder:rotate-90 flex-shrink-0" />
                      <span className="truncate">{folderName}</span>
                    </div>
                    
                    {/* Roles column - empty for folder headers */}
                    <div></div>
                    
                    {/* Email column - hidden on mobile, empty for folder headers */}
                    <div className="hidden sm:block"></div>
                    
                    {/* Phone column - empty for folder headers */}
                    <div className="hidden sm:block text-right"></div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CrewTable 
                    crew={folderCrew}
                    selectedItem={selectedItem}
                    onItemSelect={setSelectedItem}
                    highlightedItem={highlightedItem}
                  />
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
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