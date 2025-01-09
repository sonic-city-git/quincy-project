import { useState, useCallback, useRef } from "react";
import { Equipment } from "@/types/equipment";
import { useDebounceResize } from "@/hooks/useDebounceResize";
import { EquipmentHeader } from "../header/EquipmentHeader";
import { EquipmentContent } from "./EquipmentContent";

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

  const handleResize = useCallback(() => {
    // Empty callback is enough to trigger the debounced resize handling
  }, []);

  const { observe, unobserve } = useDebounceResize(handleResize);

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] px-8 py-6" ref={containerRef}>
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

      <EquipmentContent
        filteredEquipment={equipment}
        selectedItems={selectedItems}
        selectedEquipment={selectedEquipment}
        startDate={startDate}
        daysToShow={daysToShow}
        onSelectAll={onSelectAll}
        onItemSelect={onItemSelect}
        onPreviousPeriod={onPreviousPeriod}
        onNextPeriod={onNextPeriod}
        observe={observe}
        unobserve={unobserve}
        onAddEquipment={onAddEquipment}
        onEditEquipment={onEditEquipment}
        onDeleteEquipment={onDeleteEquipment}
      />
    </div>
  );
}