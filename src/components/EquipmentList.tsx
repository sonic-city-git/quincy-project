import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { Loader2 } from "lucide-react";
import { useEquipment } from "@/hooks/useEquipment";
import { EquipmentTable } from "./equipment/EquipmentTable";
import { EquipmentListHeader } from "./equipment/EquipmentListHeader";
import { useEquipmentFilters } from "./equipment/filters/useEquipmentFilters";

export function EquipmentList() {
  const { equipment = [], loading, refetch } = useEquipment();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const { 
    searchQuery, 
    setSearchQuery,
    selectedFolders,
    handleFolderToggle,
    clearFilters, 
    filterEquipment 
  } = useEquipmentFilters();

  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleItemSelect = (id: string) => {
    setSelectedItem(prev => prev === id ? null : id);
  };

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
              selectedItem={selectedItem}
              onEquipmentDeleted={() => setSelectedItem(null)}
              selectedFolders={selectedFolders}
              onFolderToggle={handleFolderToggle}
            />
            <Separator className="bg-zinc-800" />
            
            <div className="rounded-lg overflow-hidden border border-zinc-800 flex-1 min-h-0">
              <div className="h-full overflow-auto">
                <EquipmentTable 
                  equipment={filteredEquipment} 
                  selectedItem={selectedItem}
                  onItemSelect={handleItemSelect}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}