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
      <div className="flex justify-center items-center w-6">
        <MapPin 
          className={`h-4 w-4 ${event.location ? 'text-green-500' : 'text-muted-foreground'}`} 
        />
      </div>

      <div className="flex justify-center items-center w-6">
        {event.type.needs_equipment && (
          <EquipmentIcon
            isSynced={isSynced}
            isEditingDisabled={isEditingDisabled}
            onViewEquipment={onViewEquipment}
            onSyncEquipment={onSyncEquipment}
            className="h-4 w-4"
          />
        )}
      </div>

      <div className="flex justify-center items-center w-6">
        {event.type.needs_crew && (
          <Users className={`h-4 w-4 ${isEditingDisabled ? 'text-green-500' : 'text-muted-foreground'}`} />
        )}
      </div>
    </>
  );
}