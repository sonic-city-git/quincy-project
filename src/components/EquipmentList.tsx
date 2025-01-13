import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { Table } from "./ui/table";
import { EquipmentTableHeader } from "./equipment/EquipmentTableHeader";
import { EquipmentTable } from "./equipment/EquipmentTable";
import { EquipmentListHeader } from "./equipment/EquipmentListHeader";
import { useEquipment } from "@/hooks/useEquipment";
import { useEquipmentFilters } from "./equipment/filters/useEquipmentFilters";

export function EquipmentList() {
  const { equipment, loading } = useEquipment();
  const {
    searchQuery,
    setSearchQuery,
    selectedFolders,
    handleFolderToggle,
    clearFilters,
    filterEquipment
  } = useEquipmentFilters();

  const filteredEquipment = filterEquipment(equipment || []);

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
              <div className="sticky top-0 z-20 bg-zinc-900/95 border-b border-zinc-800 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/75">
                <Table>
                  <EquipmentTableHeader />
                </Table>
              </div>
              <div className="overflow-y-auto flex-1">
                <EquipmentTable
                  equipment={filteredEquipment}
                  selectedItem={null}
                  onItemSelect={() => {}}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}