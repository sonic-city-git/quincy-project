import { useState, useCallback, useRef } from "react";
import { addDays, subDays } from "date-fns";
import { useDebounceResize } from "@/hooks/useDebounceResize";
import { EquipmentHeader } from "./equipment/EquipmentHeader";
import { EquipmentContent } from "./equipment/EquipmentContent";
import { Equipment } from "@/types/equipment";

interface EquipmentListProps {
  equipment: Equipment[];
  selectedItems: string[];
  selectedFolder: string | null;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onFolderSelect: (folderId: string | null) => void;
  onAddEquipment: (equipment: Equipment) => void;
  onEditEquipment: (equipment: Equipment) => void;
  onDeleteEquipment: (ids: string[]) => void;
  onItemSelect: (id: string) => void;
  onSelectAll: () => void;
}

export function EquipmentList({
  equipment,
  selectedItems,
  selectedFolder,
  searchTerm,
  onSearchChange,
  onFolderSelect,
  onAddEquipment,
  onEditEquipment,
  onDeleteEquipment,
  onItemSelect,
  onSelectAll,
}: EquipmentListProps) {
  const [startDate, setStartDate] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);
  const daysToShow = 14;

  const handleResize = useCallback(() => {
    // Empty callback is enough to trigger the debounced resize handling
  }, []);

  const { observe, unobserve } = useDebounceResize(handleResize);

  const handlePreviousPeriod = useCallback(() => {
    setStartDate(prev => subDays(prev, daysToShow));
  }, [daysToShow]);

  const handleNextPeriod = useCallback(() => {
    setStartDate(prev => addDays(prev, daysToShow));
  }, [daysToShow]);

  const handleDeleteEquipment = useCallback(() => {
    onDeleteEquipment(selectedItems);
  }, [onDeleteEquipment, selectedItems]);

  const selectedEquipment = equipment
    .filter(item => selectedItems.includes(item.id))
    .map(item => ({
      id: item.id,
      name: item.name
    }));

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))]" ref={containerRef}>
      <EquipmentHeader
        selectedFolder={selectedFolder}
        onFolderSelect={onFolderSelect}
        onAddEquipment={onAddEquipment}
        onEditEquipment={onEditEquipment}
        onDeleteEquipment={handleDeleteEquipment}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        selectedItems={selectedItems}
        equipment={equipment}
      />

      <EquipmentContent
        filteredEquipment={equipment}
        selectedItems={selectedItems}
        selectedEquipment={selectedEquipment}
        startDate={startDate}
        daysToShow={daysToShow}
        onSelectAll={onSelectAll}
        onItemSelect={onItemSelect}
        onPreviousPeriod={handlePreviousPeriod}
        onNextPeriod={handleNextPeriod}
        observe={observe}
        unobserve={unobserve}
      />
    </div>
  );
}