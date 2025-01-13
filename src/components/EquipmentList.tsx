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

  // Group equipment by folder
  const groupedEquipment = filteredEquipment.reduce((acc, item) => {
    const folder = folders.find(f => f.id === item.folder_id);
    const folderName = folder ? folder.name : 'Uncategorized';
    if (!acc[folderName]) {
      acc[folderName] = [];
    }
    acc[folderName].push(item);
    return acc;
  }, {} as Record<string, typeof filteredEquipment>);

  // Sort folders according to the predefined order
  const sortedFolders = Object.keys(groupedEquipment).sort((a, b) => {
    const orderA = FOLDER_ORDER.indexOf(a);
    const orderB = FOLDER_ORDER.indexOf(b);
    if (orderA === -1 && orderB === -1) return a.localeCompare(b);
    if (orderA === -1) return 1;
    if (orderB === -1) return -1;
    return orderA - orderB;
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
            <div className="rounded-lg overflow-hidden border border-zinc-800 flex-1 min-h-0">
              <Table>
                <EquipmentTableHeader />
              </Table>
              <div className="divide-y divide-zinc-800">
                {sortedFolders.map((folderName) => (
                  <div key={folderName}>
                    <div className="bg-zinc-800/50 px-4 py-2 font-medium text-sm text-zinc-400">
                      {folderName}
                    </div>
                    <EquipmentTable 
                      equipment={groupedEquipment[folderName]}
                      selectedItem={selectedItem}
                      onItemSelect={setSelectedItem}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Predefined folder order
const FOLDER_ORDER = [
  "Mixers",
  "Microphones",
  "DI-boxes",
  "Cables/Split",
  "WL",
  "Outboard",
  "Stands/Clamps",
  "Misc",
  "Flightcases",
  "Consumables",
  "Kits",
  "Mindnes"
];