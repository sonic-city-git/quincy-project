import { useEffect } from "react";
import { EquipmentList } from "@/components/EquipmentList";
import { useEquipmentData } from "@/hooks/useEquipmentData";
import { useEquipmentFilter } from "@/hooks/useEquipmentFilter";
import { useEquipmentSelection } from "@/hooks/useEquipmentSelection";

export function EquipmentListContainer() {
  const { 
    equipment, 
    isLoading, 
    handleAddEquipment, 
    handleEditEquipment, 
    handleDeleteEquipment 
  } = useEquipmentData();

  const {
    selectedFolder,
    setSelectedFolder,
    searchTerm,
    setSearchTerm,
    filterEquipment,
  } = useEquipmentFilter();

  const {
    selectedItems,
    handleItemSelect,
    handleSelectAll,
    clearSelection,
  } = useEquipmentSelection();

  const filteredEquipment = filterEquipment(equipment);

  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolder(folderId);
    clearSelection();
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-[400px]">Loading equipment...</div>;
  }

  return (
    <EquipmentList
      equipment={filteredEquipment}
      selectedItems={selectedItems}
      selectedFolder={selectedFolder}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onFolderSelect={handleFolderSelect}
      onAddEquipment={handleAddEquipment}
      onEditEquipment={handleEditEquipment}
      onDeleteEquipment={handleDeleteEquipment}
      onItemSelect={handleItemSelect}
      onSelectAll={() => handleSelectAll(filteredEquipment)}
    />
  );
}