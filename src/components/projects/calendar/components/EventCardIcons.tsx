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
  const iconClasses = "h-6 w-6";

  return (
    <>
      <div className="flex items-center justify-center">
        <MapPin 
          className={`${iconClasses} ${event.location ? 'text-green-500' : 'text-muted-foreground'}`} 
        />
      </div>

      <div className="flex items-center justify-center">
        {event.type.needs_equipment && (
          <EquipmentIcon
            isSynced={isSynced}
            isEditingDisabled={isEditingDisabled}
            onViewEquipment={onViewEquipment}
            onSyncEquipment={onSyncEquipment}
            className={iconClasses}
          />
        )}
      </div>

      <div className="flex items-center justify-center">
        {event.type.needs_crew && (
          <Users className={`${iconClasses} ${isEditingDisabled ? 'text-green-500' : 'text-muted-foreground'}`} />
        )}
      </div>
    </>
  );
}