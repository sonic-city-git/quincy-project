import { EquipmentListHeader } from "@/components/equipment/EquipmentListHeader";
import { EquipmentTable } from "@/components/equipment/EquipmentTable";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EquipmentSelectorProps {
  onSelect: (equipmentId: string) => void;
  projectId: string;
  selectedGroupId: string | null;
}

export function EquipmentSelector({ onSelect, projectId, selectedGroupId }: EquipmentSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const { data: equipment = [] } = useQuery({
    queryKey: ['available-equipment', searchQuery, selectedFolders],
    queryFn: async () => {
      let query = supabase
        .from('equipment')
        .select('*')
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

  const handleFolderToggle = (folderId: string) => {
    setSelectedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedFolders([]);
  };

  return (
    <div className="space-y-4">
      <EquipmentListHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearFilters={handleClearFilters}
        selectedItem={selectedItem}
        onEquipmentDeleted={() => setSelectedItem(null)}
        selectedFolders={selectedFolders}
        onFolderToggle={handleFolderToggle}
      />
      <div className="flex-1 overflow-hidden">
        <EquipmentTable
          equipment={equipment}
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