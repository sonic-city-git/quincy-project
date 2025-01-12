import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { Loader2, ChevronRight, ChevronDown, Folder } from "lucide-react";
import { useEquipment } from "@/hooks/useEquipment";
import { EquipmentTable } from "./equipment/EquipmentTable";
import { EquipmentListHeader } from "./equipment/EquipmentListHeader";
import { useEquipmentFilters } from "./equipment/filters/useEquipmentFilters";
import { useFolders } from "@/hooks/useFolders";
import { Equipment } from "@/types/equipment";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";

export function EquipmentList() {
  const { equipment = [], loading, refetch } = useEquipment();
  const { folders = [], loading: foldersLoading } = useFolders();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [openFolders, setOpenFolders] = useState<string[]>([]);
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

  const toggleFolder = (folderId: string) => {
    setOpenFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  const groupEquipmentByFolder = (items: Equipment[]) => {
    const grouped: Record<string, Equipment[]> = {};
    
    items.forEach(item => {
      const folderId = item.folder_id || 'unassigned';
      if (!grouped[folderId]) {
        grouped[folderId] = [];
      }
      grouped[folderId].push(item);
    });
    
    return grouped;
  };

  if (loading || foldersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filteredEquipment = filterEquipment(equipment);
  const groupedEquipment = groupEquipmentByFolder(filteredEquipment);
  const parentFolders = folders.filter(f => !f.parent_id);

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
                {parentFolders.map(parentFolder => {
                  const subfolders = folders.filter(f => f.parent_id === parentFolder.id);
                  const isOpen = openFolders.includes(parentFolder.id);

                  return (
                    <Collapsible
                      key={parentFolder.id}
                      open={isOpen}
                      onOpenChange={() => toggleFolder(parentFolder.id)}
                    >
                      <CollapsibleTrigger className="w-full flex items-center gap-2 p-2 hover:bg-zinc-800/50 transition-colors">
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <Folder className="h-4 w-4 text-primary" />
                        <span className="font-medium">{parentFolder.name}</span>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="pl-6">
                          {subfolders.map(subfolder => {
                            const folderEquipment = groupedEquipment[subfolder.id] || [];
                            if (folderEquipment.length === 0) return null;

                            return (
                              <div key={subfolder.id} className="border-l border-zinc-800">
                                <div className="flex items-center gap-2 p-2 pl-4">
                                  <Folder className="h-4 w-4 text-secondary" />
                                  <span className="text-sm font-medium text-secondary">
                                    {subfolder.name}
                                  </span>
                                </div>
                                <div className="pl-4">
                                  <EquipmentTable 
                                    equipment={folderEquipment}
                                    selectedItem={selectedItem}
                                    onItemSelect={handleItemSelect}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
                
                {/* Show unassigned equipment if any */}
                {groupedEquipment['unassigned']?.length > 0 && (
                  <div className="p-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Folder className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-muted-foreground">Unassigned</span>
                    </div>
                    <EquipmentTable 
                      equipment={groupedEquipment['unassigned']}
                      selectedItem={selectedItem}
                      onItemSelect={handleItemSelect}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}