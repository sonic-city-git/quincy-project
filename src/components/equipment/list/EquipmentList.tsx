import { Equipment } from "@/types/equipment";
import { EquipmentHeader } from "../EquipmentHeader";
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
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))]" ref={containerRef}>
      <EquipmentHeader
        selectedFolder={selectedFolder}
        onFolderSelect={onFolderSelect}
        onAddEquipment={onAddEquipment}
        onEditEquipment={onEditEquipment}
        onDeleteEquipment={onDeleteEquipment}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        selectedItems={selectedItems}
        equipment={equipment}
      />

      <div className="flex-1 flex flex-col bg-zinc-900 rounded-md mt-4 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <EquipmentTable
            equipment={equipment}
            selectedItems={selectedItems}
            onSelectAll={onSelectAll}
            onItemSelect={onItemSelect}
          />
        </div>

        <div className="flex-shrink-0">
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
    </div>
  );
}