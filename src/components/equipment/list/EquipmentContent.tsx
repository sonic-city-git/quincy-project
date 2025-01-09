import { Equipment } from "@/types/equipment";
import { EquipmentTable } from "../table/EquipmentTable";
import { EquipmentTimeline } from "../timeline/EquipmentTimeline";

interface EquipmentContentProps {
  filteredEquipment: Equipment[];
  selectedItems: string[];
  selectedEquipment: { id: string; name: string; }[];
  startDate: Date;
  daysToShow: number;
  onSelectAll: () => void;
  onItemSelect: (id: string) => void;
  onPreviousPeriod: () => void;
  onNextPeriod: () => void;
  observe: (element: Element | null) => void;
  unobserve: (element: Element | null) => void;
}

export function EquipmentContent({
  filteredEquipment,
  selectedItems,
  selectedEquipment,
  startDate,
  daysToShow,
  onSelectAll,
  onItemSelect,
  onPreviousPeriod,
  onNextPeriod,
  observe,
  unobserve,
}: EquipmentContentProps) {
  return (
    <div className="flex-1 flex flex-col bg-zinc-900 rounded-md mt-6 overflow-hidden">
      <div className="flex-1 overflow-auto p-4">
        <EquipmentTable
          equipment={filteredEquipment}
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
  );
}