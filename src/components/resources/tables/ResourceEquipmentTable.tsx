/**
 * CONSOLIDATED: ResourceEquipmentTable with collapsible folder structure
 * Features: Cmd+click expansion, proper hierarchy, persistent state
 */

import { useState, useEffect } from "react";
import { useEquipment } from "@/hooks/equipment";
import { useFolders } from "@/hooks/ui";
import { EquipmentTable } from "../equipment/EquipmentTable";

import { EquipmentTableHeader } from "../equipment/EquipmentTableHeader";
import { createOrderedEquipmentFolders } from "@/utils/equipmentFolderSort";
import { EditEquipmentDialog } from "../equipment/EditEquipmentDialog";
import { ResourceFilters } from "../ResourcesHeader";
import { useScrollToTarget } from "../shared/hooks/useScrollToTarget";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { useResourceFiltering } from "../shared/hooks/useResourceFiltering";
import { COMPONENT_CLASSES, cn } from "@/design-system";
import { Package, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { usePersistentExpandedGroups } from "@/hooks/ui";

interface ResourceEquipmentTableProps {
  filters: ResourceFilters;
  targetScrollItem?: {
    type: 'equipment';
    id: string;
  } | null;
}

export function ResourceEquipmentTable({ filters, targetScrollItem }: ResourceEquipmentTableProps) {
  const { equipment = [], loading } = useEquipment();
  const { folders = [] } = useFolders();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Persistent expansion state for folders
  const { expandedGroups, toggleGroup } = usePersistentExpandedGroups('resourceEquipmentExpandedGroups');

  // Use consolidated hooks
  const { highlightedItem, isHighlighted } = useScrollToTarget(
    targetScrollItem, 
    equipment.length > 0, 
    'equipment'
  );
  
  const filteredEquipment = useResourceFiltering(
    equipment, 
    filters, 
    'equipment', 
    { folders }
  );

  const selectedEquipment = equipment.find(item => item.id === selectedItem);

  if (loading) {
    return <LoadingSpinner message="Loading equipment..." />;
  }

  // Group equipment by folder and subfolder (equipment goes only to its direct folder)
  const groupedEquipment = filteredEquipment.reduce((acc, item) => {
    const folder = folders.find(f => f.id === item.folder_id);
    if (!folder) {
      if (!acc['Uncategorized']) acc['Uncategorized'] = [];
      acc['Uncategorized'].push(item);
      return acc;
    }

    // Find parent folder if this is a subfolder
    const parentFolder = folder.parent_id 
      ? folders.find(f => f.id === folder.parent_id)
      : null;

    if (parentFolder) {
      // This is a subfolder - add only to subfolder path
      const subfolderPath = `${parentFolder.name}/${folder.name}`;
      if (!acc[subfolderPath]) acc[subfolderPath] = [];
      acc[subfolderPath].push(item);
    } else {
      // This is a main folder - add only to main folder
      const folderName = folder.name;
      if (!acc[folderName]) acc[folderName] = [];
      acc[folderName].push(item);
    }
    
    return acc;
  }, {} as Record<string, typeof filteredEquipment>);

  // Create ordered folder structure with proper hierarchy (consolidated utility)
  const orderedFolders = createOrderedEquipmentFolders(folders, groupedEquipment);

  const handleItemSelect = (id: string) => {
    setSelectedItem(id);
    setEditDialogOpen(true);
  };

  const handleDialogClose = () => {
    setEditDialogOpen(false);
    setSelectedItem(null);
  };

  if (filteredEquipment.length === 0) {
    const getEmptyMessage = () => {
      if (filters.search) {
        return 'No equipment matches your search';
      }
      if (filters.equipmentType) {
        return 'No equipment found for this type';
      }
      return 'No equipment found. Add your first equipment to get started!';
    };

    return (
      <div className="w-full">
        {/* Sticky table header */}
        <div className={cn("sticky top-[124px] z-30", COMPONENT_CLASSES.table.container)}>
          <EquipmentTableHeader />
        </div>

        {/* Empty state content */}
        <div className={cn("rounded-b-lg", COMPONENT_CLASSES.table.container)}>
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">{getEmptyMessage()}</p>
            {!filters.search && !filters.equipmentType && (
              <p className="text-sm">Equipment helps you organize gear and track availability for your projects.</p>
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
        <EquipmentTableHeader />
      </div>
      
      {/* Table content */}
      <div className={cn("rounded-b-lg", COMPONENT_CLASSES.table.container)}>
        <div className="divide-y divide-border">
          {orderedFolders.map(({ path, level, isSubfolder, equipment: folderEquipment }) => {
            if (!folderEquipment) return null;
            
            const isExpanded = expandedGroups.has(path);
            const mainFolderPath = path.split('/')[0];
            
            // For subfolders, check if parent folder is expanded
            const isParentExpanded = isSubfolder ? expandedGroups.has(mainFolderPath) : true;
            
            // Don't render subfolders if their parent is collapsed
            if (isSubfolder && !isParentExpanded) {
              return null;
            }
            
            // Get all subfolder paths for this main folder (for Cmd+click)
            const availableSubfolders = orderedFolders
              .filter(f => f.path.startsWith(mainFolderPath + '/'))
              .map(f => f.path);
            
            return (
              <Collapsible key={path} open={isExpanded}>
                <CollapsibleTrigger 
                  className="w-full group/folder"
                  onClick={(e) => {
                    // Cmd+click to expand all subfolders (like planner)
                    const expandAllSubfolders = e.metaKey || e.ctrlKey;
                    toggleGroup(path, expandAllSubfolders, availableSubfolders);
                  }}
                >
                  <div 
                    className={cn(
                      "grid grid-cols-[2fr_120px_100px] sm:grid-cols-[2fr_120px_80px_100px] gap-3 sm:gap-4 bg-muted/50 hover:bg-muted transition-colors py-2 font-medium text-sm text-muted-foreground",
                      "p-3 sm:p-4"
                    )}
                  >
                    {/* Name column with proper indentation */}
                    <div className="flex items-center gap-2 min-w-0" style={{ paddingLeft: `${level * 24}px` }}>
                      <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/folder:rotate-90 flex-shrink-0" />
                      <span className="truncate">{isSubfolder ? path.split('/')[1] : path}</span>
                    </div>
                    
                    {/* Code column - empty for folder headers */}
                    <div></div>
                    
                    {/* Stock column - hidden on mobile, empty for folder headers */}
                    <div className="hidden sm:block"></div>
                    
                    {/* Price column - empty for folder headers */}
                    <div className="text-right"></div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <EquipmentTable 
                    equipment={folderEquipment}
                    selectedItem={selectedItem}
                    onItemSelect={handleItemSelect}
                    highlightedItem={highlightedItem}
                  />
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </div>

      {selectedEquipment && (
        <EditEquipmentDialog
          key={selectedEquipment.id}
          open={editDialogOpen}
          onOpenChange={handleDialogClose}
          equipment={selectedEquipment}
        />
      )}
    </>
  );
}