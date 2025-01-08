import { useState, useCallback, useRef } from "react";
import { addDays, subDays } from "date-fns";
import { useDebounceResize } from "@/hooks/useDebounceResize";
import { EquipmentTimeline } from "./equipment/EquipmentTimeline";
import { EquipmentTable } from "./equipment/EquipmentTable";
import { EquipmentHeader } from "./equipment/EquipmentHeader";
import { useEquipmentData } from "@/hooks/useEquipmentData";
import { useEquipmentFilter } from "@/hooks/useEquipmentFilter";
import { useEquipmentSelection } from "@/hooks/useEquipmentSelection";
import { EquipmentSelectionActions } from "./equipment/actions/EquipmentSelectionActions";

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
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <div className="flex-1 flex flex-col bg-zinc-900 rounded-md mt-4 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <EquipmentSelectionActions
            selectedItems={selectedItems}
            equipment={equipment}
            onEditEquipment={handleEditEquipment}
            onDeleteEquipment={() => {
              handleDeleteEquipment(selectedItems);
              clearSelection();
            }}
          />

          <EquipmentTable
            equipment={filteredEquipment}
            selectedItems={selectedItems}
            onSelectAll={() => handleSelectAll(filteredEquipment)}
            onItemSelect={handleItemSelect}
          />
        </div>

        <div className="flex-shrink-0">
          <EquipmentTimeline
            startDate={startDate}
            daysToShow={daysToShow}
            selectedEquipment={selectedEquipment}
            onPreviousPeriod={handlePreviousPeriod}
            onNextPeriod={handleNextPeriod}
            onMount={observe}
            onUnmount={unobserve}
          />
        </div>
      </div>
    </div>
  );
}