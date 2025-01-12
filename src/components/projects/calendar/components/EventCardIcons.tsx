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
      <div className="flex items-center justify-center">
        <MapPin 
          className={`h-5 w-5 ${event.location ? 'text-green-500' : 'text-muted-foreground'}`} 
        />
      </div>

      <div className="flex items-center justify-center">
        <div className="w-5" /> {/* Empty space column */}
      </div>

      <div className="flex items-center justify-center">
        {event.type.needs_equipment && (
          <EquipmentIcon
            isSynced={isSynced}
            isEditingDisabled={isEditingDisabled}
            onViewEquipment={onViewEquipment}
            onSyncEquipment={onSyncEquipment}
            className="h-5 w-5"
          />
        )}
      </div>

      <div className="flex items-center justify-center">
        {event.type.needs_crew && (
          <Users className={`h-5 w-5 ${isEditingDisabled ? 'text-green-500' : 'text-muted-foreground'}`} />
        )}
      </div>
    </>
  );
}