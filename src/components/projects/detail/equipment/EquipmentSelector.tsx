import { EquipmentListHeader } from "@/components/equipment/EquipmentListHeader";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEquipmentFilters } from "@/components/equipment/filters/useEquipmentFilters";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EquipmentSelectorProps {
  onSelect: (equipmentId: string) => void;
  projectId: string;
  selectedGroupId: string | null;
}

export function EquipmentSelector({ onSelect, projectId, selectedGroupId }: EquipmentSelectorProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const {
    searchQuery,
    setSearchQuery,
    selectedFolders,
    handleFolderToggle,
    clearFilters,
    filterEquipment
  } = useEquipmentFilters();

  const { data: equipment = [] } = useQuery({
    queryKey: ['available-equipment', searchQuery, selectedFolders],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select(`
          *,
          equipment_folders (
            id,
            name,
            parent_id
          )
        `)
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  const filteredEquipment = filterEquipment(equipment);

  return (
    <div className="space-y-4">
      <EquipmentListHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearFilters={clearFilters}
        selectedItem={selectedItem}
        onEquipmentDeleted={() => setSelectedItem(null)}
        selectedFolders={selectedFolders}
        onFolderToggle={handleFolderToggle}
      />
      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="space-y-1">
          {filteredEquipment.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className="w-full text-left px-4 py-2 hover:bg-accent rounded-md transition-colors"
            >
              {item.name}
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}