import { useEffect, useMemo } from "react";
import { EquipmentList } from "@/components/EquipmentList";
import { useEquipmentData } from "@/hooks/useEquipmentData";
import { useEquipmentFilter } from "@/hooks/useEquipmentFilter";
import { useEquipmentSelection } from "@/hooks/useEquipmentSelection";
import { useEquipmentTimeline } from "@/hooks/useEquipmentTimeline";

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

  const {
    startDate,
    handlePreviousPeriod,
    handleNextPeriod,
  } = useEquipmentTimeline();

  // Memoize filtered equipment to prevent unnecessary recalculations
  const filteredEquipment = useMemo(() => {
    return filterEquipment(equipment);
  }, [equipment, filterEquipment]);

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