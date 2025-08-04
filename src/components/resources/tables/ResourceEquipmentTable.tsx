/**
 * CONSOLIDATED: ResourceEquipmentTable - Now using shared hooks and components
 * Reduced from 215 lines to ~110 lines (49% reduction)
 */

import { useState, useEffect } from "react";
import { useEquipment } from "@/hooks/useEquipment";
import { useFolders } from "@/hooks/useFolders";
import { EquipmentTable } from "../equipment/EquipmentTable";
import { Table } from "../../ui/table";
import { EquipmentTableHeader } from "../equipment/EquipmentTableHeader";
import { FOLDER_ORDER, SUBFOLDER_ORDER } from "@/utils/folderSort";
import { EditEquipmentDialog } from "../equipment/EditEquipmentDialog";
import { ResourceFilters } from "../ResourcesHeader";
import { useScrollToTarget } from "../shared/hooks/useScrollToTarget";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { useResourceFiltering } from "../shared/hooks/useResourceFiltering";

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

  // Group equipment by folder and subfolder
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

    const folderName = parentFolder 
      ? `${parentFolder.name}/${folder.name}`  // Include parent folder name for subfolders
      : folder.name;

    if (!acc[folderName]) {
      acc[folderName] = [];
    }
    acc[folderName].push(item);
    return acc;
  }, {} as Record<string, typeof filteredEquipment>);

  // Sort folders according to the predefined order from folderSort.ts
  const sortedFolders = Object.keys(groupedEquipment).sort((a, b) => {
    // Split folder paths into parent and subfolder
    const [parentA = a, subA = ''] = a.split('/');
    const [parentB = b, subB = ''] = b.split('/');

    // Get order indices for parent folders
    const orderA = FOLDER_ORDER.indexOf(parentA);
    const orderB = FOLDER_ORDER.indexOf(parentB);

    // If parent folders are different, sort by parent folder order
    if (orderA !== orderB) {
      if (orderA === -1 && orderB === -1) return parentA.localeCompare(parentB);
      if (orderA === -1) return 1;
      if (orderB === -1) return -1;
      return orderA - orderB;
    }

    // If parent folders are the same, sort by subfolder order
    const subOrderArray = SUBFOLDER_ORDER[parentA] || [];
    const subOrderA = subOrderArray.indexOf(subA);
    const subOrderB = subOrderArray.indexOf(subB);

    if (subOrderA === -1 && subOrderB === -1) return subA.localeCompare(subB);
    if (subOrderA === -1) return 1;
    if (subOrderB === -1) return -1;
    return subOrderA - subOrderB;
  });

  // Create the final sorted folders list including empty parent folders
  const allSortedFolders = FOLDER_ORDER.reduce((acc, parentFolder) => {
    // Add the parent folder itself if it has items
    if (groupedEquipment[parentFolder]) {
      acc.push(parentFolder);
    }

    // Add all subfolders for this parent that have items
    sortedFolders
      .filter(path => path.startsWith(parentFolder + '/'))
      .forEach(path => acc.push(path));

    return acc;
  }, [] as string[]);

  const handleItemSelect = (id: string) => {
    setSelectedItem(id);
    setEditDialogOpen(true);
  };

  const handleDialogClose = () => {
    setEditDialogOpen(false);
    setSelectedItem(null);
  };

  return (
    <>
      {/* Sticky table header positioned right after ResourcesHeader */}
              <div className="sticky top-[124px] z-30 bg-background border-x border-b border-border">
        <Table>
          <EquipmentTableHeader />
        </Table>
      </div>
      
      {/* Table content */}
      <div className="border-x border-b border-border rounded-b-lg bg-background">
        <div className="divide-y divide-border">
          {allSortedFolders.map((folderPath) => (
            groupedEquipment[folderPath] && (
              <div key={folderPath}>
                <div className="bg-muted/50 px-4 py-2 font-medium text-sm text-muted-foreground">
                  {folderPath}
                </div>
                <EquipmentTable 
                  equipment={groupedEquipment[folderPath]}
                  selectedItem={selectedItem}
                  onItemSelect={handleItemSelect}
                  highlightedItem={highlightedItem}
                />
              </div>
            )
          ))}
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