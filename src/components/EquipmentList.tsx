import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { Loader2 } from "lucide-react";
import { useEquipment } from "@/hooks/useEquipment";
import { EquipmentTable } from "./equipment/EquipmentTable";
import { EquipmentListHeader } from "./equipment/EquipmentListHeader";
import { useEquipmentFilters } from "./equipment/filters/useEquipmentFilters";
import { useFolders } from "@/hooks/useFolders";
import { Table } from "./ui/table";
import { EquipmentTableHeader } from "./equipment/EquipmentTableHeader";
import { FOLDER_ORDER, SUBFOLDER_ORDER } from "@/utils/folderSort";

export function EquipmentList() {
  const { equipment = [], loading } = useEquipment();
  const { folders = [] } = useFolders();
  const {
    searchQuery,
    setSearchQuery,
    selectedFolders,
    handleFolderToggle,
    clearFilters,
    filterEquipment
  } = useEquipmentFilters();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filteredEquipment = filterEquipment(equipment);

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

  return (
    <div className="h-[calc(100vh-2rem)] py-6">
      <Card className="border-0 shadow-md bg-zinc-900/50 h-full">
        <CardContent className="p-6 h-full flex flex-col">
          <div className="space-y-6 h-full flex flex-col">
            <EquipmentListHeader
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onClearFilters={clearFilters}
              selectedFolders={selectedFolders}
              onFolderToggle={handleFolderToggle}
            />
            <Separator className="bg-zinc-800" />
            <div className="rounded-lg overflow-hidden border border-zinc-800 flex-1 min-h-0 flex flex-col">
              <div className="sticky top-0 z-20 bg-zinc-900 border-b border-zinc-800">
                <Table>
                  <EquipmentTableHeader />
                </Table>
              </div>
              <div className="overflow-y-auto flex-1">
                <div className="divide-y divide-zinc-800">
                  {sortedFolders.map((folderPath) => (
                    <div key={folderPath}>
                      <div className="bg-zinc-800/50 px-4 py-2 font-medium text-sm text-zinc-400">
                        {folderPath}
                      </div>
                      <EquipmentTable 
                        equipment={groupedEquipment[folderPath]}
                        selectedItem={selectedItem}
                        onItemSelect={setSelectedItem}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}