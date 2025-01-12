import { EquipmentListHeader } from "@/components/equipment/EquipmentListHeader";
import { EquipmentTable } from "@/components/equipment/EquipmentTable";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEquipmentFilters } from "@/components/equipment/filters/useEquipmentFilters";

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
      let query = supabase
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

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      if (selectedFolders.length > 0) {
        query = query.in('folder_id', selectedFolders);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

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
      <div className="flex-1 overflow-hidden">
        <EquipmentTable
          equipment={filterEquipment(equipment)}
          selectedItem={selectedItem}
          onItemSelect={setSelectedItem}
          searchQuery={searchQuery}
          selectedFolders={selectedFolders}
          projectId={projectId}
          selectedGroupId={selectedGroupId}
        />
      </div>
    </div>
  );
}