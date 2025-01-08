import { useState, useCallback, useRef } from "react";
import { addDays, subDays } from "date-fns";
import { useDebounceResize } from "@/hooks/useDebounceResize";
import { EquipmentHeader } from "./equipment/EquipmentHeader";
import { EquipmentContent } from "./equipment/EquipmentContent";
import { useEquipmentData } from "@/hooks/useEquipmentData";
import { useEquipmentFilter } from "@/hooks/useEquipmentFilter";
import { useEquipmentSelection } from "@/hooks/useEquipmentSelection";

export function EquipmentList() {
  const [startDate, setStartDate] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);
  const daysToShow = 14;

  const { 
    equipment, 
    isLoading, 
    handleAddEquipment, 
    handleEditEquipment, 
    handleDeleteEquipment,
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

  const handleResize = useCallback(() => {
    // This empty callback is enough to trigger the debounced resize handling
  }, []);

  const { observe, unobserve } = useDebounceResize(handleResize);

  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolder(folderId);
    clearSelection();
  };

  const handlePreviousPeriod = () => {
    setStartDate(prev => subDays(prev, daysToShow));
  };

  const handleNextPeriod = () => {
    setStartDate(prev => addDays(prev, daysToShow));
  };

  const filteredEquipment = filterEquipment(equipment);

  const selectedEquipment = equipment
    .filter(item => selectedItems.includes(item.id))
    .map(item => ({
      id: item.id,
      name: item.name
    }));

  if (isLoading) {
    return <div className="flex justify-center items-center h-[400px]">Loading equipment...</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))]" ref={containerRef}>
      <EquipmentHeader
        selectedFolder={selectedFolder}
        onFolderSelect={handleFolderSelect}
        onAddEquipment={handleAddEquipment}
        onEditEquipment={handleEditEquipment}
        onDeleteEquipment={() => {
          handleDeleteEquipment(selectedItems);
          clearSelection();
        }}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedItems={selectedItems}
        equipment={equipment}
      />

      <EquipmentContent
        filteredEquipment={filteredEquipment}
        selectedItems={selectedItems}
        selectedEquipment={selectedEquipment}
        startDate={startDate}
        daysToShow={daysToShow}
        onSelectAll={() => handleSelectAll(filteredEquipment)}
        onItemSelect={handleItemSelect}
        onPreviousPeriod={handlePreviousPeriod}
        onNextPeriod={handleNextPeriod}
        observe={observe}
        unobserve={unobserve}
      />
    </div>
  );
}