import { Equipment } from "@/types/equipment";
import { EquipmentTable } from "../table/EquipmentTable";
import { EquipmentTimeline } from "../timeline/EquipmentTimeline";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  onAddEquipment: (equipment: Equipment) => void;
  onEditEquipment: (equipment: Equipment) => void;
  onDeleteEquipment: () => void;
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
  onAddEquipment,
  onEditEquipment,
  onDeleteEquipment,
}: EquipmentContentProps) {
  return (
    <>
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-[calc(100vh-30rem)]">
          <EquipmentTable
            equipment={filteredEquipment}
            selectedItems={selectedItems}
            onSelectAll={onSelectAll}
            onItemSelect={onItemSelect}
          />
        </ScrollArea>
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
    </>
  );
}