import { Equipment } from "@/types/equipment";
import { EquipmentHeader } from "../EquipmentHeader";
import { EquipmentSelectionHeader } from "../EquipmentSelectionHeader";
import { EquipmentTable } from "../EquipmentTable";
import { EquipmentTimeline } from "../EquipmentTimeline";
import { useRef } from "react";
import { useDebounceResize } from "@/hooks/useDebounceResize";

interface EquipmentListProps {
  equipment: Equipment[];
  selectedEquipment: { id: string; name: string; }[];
  selectedItems: string[];
  selectedFolder: string | null;
  searchTerm: string;
  startDate: Date;
  onSearchChange: (value: string) => void;
  onFolderSelect: (folderId: string | null) => void;
  onAddEquipment: (equipment: Equipment) => void;
  onEditEquipment: (equipment: Equipment) => void;
  onDeleteEquipment: () => void;
  onItemSelect: (id: string) => void;
  onSelectAll: () => void;
  onPreviousPeriod: () => void;
  onNextPeriod: () => void;
}

export function EquipmentList({
  equipment,
  selectedEquipment,
  selectedItems,
  selectedFolder,
  searchTerm,
  startDate,
  onSearchChange,
  onFolderSelect,
  onAddEquipment,
  onEditEquipment,
  onDeleteEquipment,
  onItemSelect,
  onSelectAll,
  onPreviousPeriod,
  onNextPeriod,
}: EquipmentListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const daysToShow = 14;

  const { observe, unobserve } = useDebounceResize(() => {
    // This empty callback is enough to trigger the debounced resize handling
  });

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
          onAddEquipment={onAddEquipment}
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
          onPreviousPeriod={onPreviousPeriod}
          onNextPeriod={onNextPeriod}
          onMount={observe}
          onUnmount={unobserve}
        />
      </div>
    </div>
  );
}