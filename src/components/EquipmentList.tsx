import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { Loader2 } from "lucide-react";
import { useEquipment } from "@/hooks/useEquipment";
import { EquipmentTable } from "./equipment/EquipmentTable";
import { EquipmentListHeader } from "./equipment/EquipmentListHeader";
import { useEquipmentFilters } from "./equipment/filters/useEquipmentFilters";
import { useState } from "react";

export function EquipmentList() {
  const { equipment = [], loading } = useEquipment();
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
              <EquipmentTable 
                equipment={filteredEquipment} 
                selectedItem={selectedItem}
                onItemSelect={setSelectedItem}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}