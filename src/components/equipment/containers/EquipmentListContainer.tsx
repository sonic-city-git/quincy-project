import { EquipmentList } from "../list/EquipmentList";
import { useEquipmentData } from "@/hooks/useEquipmentData";
import { useEquipmentFilter } from "@/hooks/useEquipmentFilter";
import { useEquipmentSelection } from "@/hooks/useEquipmentSelection";
import { useEquipmentTimeline } from "@/hooks/useEquipmentTimeline";
import { useEffect } from "react";

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
    filteredEquipment,
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

  useEffect(() => {
    if (equipment && Array.isArray(equipment)) {
      filterEquipment(equipment);
    }
  }, [equipment, filterEquipment]);

  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolder(folderId);
    clearSelection();
  };

  const selectedEquipment = filteredEquipment
    .filter(item => selectedItems.includes(item.id))
    .map(item => ({
      id: item.id,
      name: item.name
    }));

  if (isLoading) {
    return <div className="flex justify-center items-center h-[400px]">Loading equipment...</div>;
  }

  return (
    <EquipmentList
      equipment={filteredEquipment}
      selectedEquipment={selectedEquipment}
      selectedItems={selectedItems}
      selectedFolder={selectedFolder}
      searchTerm={searchTerm}
      startDate={startDate}
      onSearchChange={setSearchTerm}
      onFolderSelect={handleFolderSelect}
      onAddEquipment={handleAddEquipment}
      onEditEquipment={handleEditEquipment}
      onDeleteEquipment={() => {
        handleDeleteEquipment(selectedItems);
        clearSelection();
      }}
      onItemSelect={handleItemSelect}
      onSelectAll={() => handleSelectAll(filteredEquipment)}
      onPreviousPeriod={handlePreviousPeriod}
      onNextPeriod={handleNextPeriod}
    />
  );
}