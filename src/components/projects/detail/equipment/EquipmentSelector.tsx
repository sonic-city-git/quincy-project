import { EquipmentListHeader } from "@/components/equipment/EquipmentListHeader";
import { EquipmentTable } from "@/components/equipment/EquipmentTable";
import { useState } from "react";

interface EquipmentSelectorProps {
  onSelect: (equipmentId: string) => void;
  projectId: string;
  selectedGroupId: string | null;
}

export function EquipmentSelector({ onSelect, projectId, selectedGroupId }: EquipmentSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

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
      <EquipmentTable
        searchQuery={searchQuery}
        selectedFolders={selectedFolders}
        selectedItem={selectedItem}
        onSelect={setSelectedItem}
        projectId={projectId}
        selectedGroupId={selectedGroupId}
      />
    </div>
  );
}