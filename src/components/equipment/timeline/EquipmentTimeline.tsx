import { useEffect } from "react";
import { addDays, subDays } from "date-fns";
import { Equipment } from "@/types/equipment";
import { Button } from "@/components/ui/button";

interface EquipmentTimelineProps {
  startDate: Date;
  daysToShow: number;
  selectedEquipment: { id: string; name: string; }[];
  onPreviousPeriod: () => void;
  onNextPeriod: () => void;
  onMount: (element: Element | null) => void;
  onUnmount: (element: Element | null) => void;
}

export function EquipmentTimeline({
  startDate,
  daysToShow,
  selectedEquipment,
  onPreviousPeriod,
  onNextPeriod,
  onMount,
  onUnmount,
}: EquipmentTimelineProps) {
  useEffect(() => {
    const element = document.getElementById("timeline");
    if (element) {
      onMount(element);
    }
    return () => {
      if (element) {
        onUnmount(element);
      }
    };
  }, [onMount, onUnmount]);

  return (
    <div id="timeline" className="flex flex-col p-4">
      <div className="flex justify-between items-center mb-4">
        <Button onClick={onPreviousPeriod}>Previous</Button>
        <h2 className="text-lg font-semibold">Timeline</h2>
        <Button onClick={onNextPeriod}>Next</Button>
      </div>
      <div className="flex flex-col">
        {selectedEquipment.map(item => (
          <div key={item.id} className="p-2 border-b border-gray-300">
            <span>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
