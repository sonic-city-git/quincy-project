import { Equipment } from "@/types/equipment";
import { EquipmentHeader } from "../EquipmentHeader";
import { EquipmentSelectionHeader } from "../EquipmentSelectionHeader";
import { EquipmentTable } from "../EquipmentTable";
import { EquipmentTimeline } from "../EquipmentTimeline";
import { useCallback, useRef, useState } from "react";
import { addDays, subDays } from "date-fns";
import { useDebounceResize } from "@/hooks/useDebounceResize";

interface EquipmentListProps {
  equipment: Equipment[];
  selectedEquipment: { id: string; name: string; }[];
  selectedItems: string[];
  selectedFolder: string | null;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onFolderSelect: (folderId: string | null) => void;
  onAddEquipment: (equipment: Equipment) => void;
  onEditEquipment: (equipment: Equipment) => void;
  onDeleteEquipment: () => void;
  onItemSelect: (id: string) => void;
  onSelectAll: () => void;
}

export function EquipmentList({
  equipment,
  selectedEquipment,
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
    // This empty callback is enough to trigger the debounced resize handling
  }, []);

  const { observe, unobserve } = useDebounceResize(handleResize);

  const handlePreviousPeriod = () => {
    setStartDate(prev => subDays(prev, daysToShow));
  };

  const handleNextPeriod = () => {
    setStartDate(prev => addDays(prev, daysToShow));
  };

  return (
    <div className="space-y-4" ref={containerRef}>
      <EquipmentHeader
        selectedFolder={selectedFolder}
        onFolderSelect={onFolderSelect}
        onAddEquipment={onAddEquipment}
      />

      <div className="bg-zinc-900 rounded-md">
        <EquipmentSelectionHeader
          selectedItems={selectedItems}
          equipment={equipment}
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          onEditEquipment={onEditEquipment}
          onDeleteEquipment={onDeleteEquipment}
        />

        <EquipmentTable
          equipment={equipment}
          selectedItems={selectedItems}
          onSelectAll={onSelectAll}
          onItemSelect={onItemSelect}
        />

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
  );
}