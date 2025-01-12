import { MapPin, Users } from "lucide-react";
import { EquipmentIcon } from "./EquipmentIcon";
import { CalendarEvent } from "@/types/events";

interface EventCardIconsProps {
  event: CalendarEvent;
  isSynced: boolean;
  isEditingDisabled: boolean;
  onViewEquipment: () => void;
  onSyncEquipment: () => void;
}

export function EventCardIcons({
  event,
  isSynced,
  isEditingDisabled,
  onViewEquipment,
  onSyncEquipment
}: EventCardIconsProps) {
  return (
    <>
      <div className="flex justify-center items-center">
        <MapPin 
          className={`h-7 w-7 ${event.location ? 'text-green-500' : 'text-muted-foreground'}`} 
        />
      </div>

      <div className="flex justify-center items-center">
        {event.type.needs_equipment && (
          <EquipmentIcon
            isSynced={isSynced}
            isEditingDisabled={isEditingDisabled}
            onViewEquipment={onViewEquipment}
            onSyncEquipment={onSyncEquipment}
          />
        )}
      </div>

      <div className="flex justify-center items-center">
        {event.type.needs_crew && (
          <Users className={`h-7 w-7 ${isEditingDisabled ? 'text-green-500' : 'text-muted-foreground'}`} />
        )}
      </div>
    </>
  );
}