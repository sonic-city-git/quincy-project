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
  const iconContainerClasses = "h-8 w-8 flex items-center justify-center";
  const iconClasses = "h-5 w-5";

  return (
    <>
      <div className="flex items-center justify-center">
        <div className={iconContainerClasses}>
          <MapPin 
            className={`${iconClasses} ${event.location ? 'text-green-500' : 'text-muted-foreground'}`} 
          />
        </div>
      </div>

      <div className="flex items-center justify-center">
        {event.type.needs_equipment && (
          <div className={iconContainerClasses}>
            <EquipmentIcon
              isSynced={isSynced}
              isEditingDisabled={isEditingDisabled}
              onViewEquipment={onViewEquipment}
              onSyncEquipment={onSyncEquipment}
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-center">
        {event.type.needs_crew && (
          <div className={iconContainerClasses}>
            <Users className={`${iconClasses} ${isEditingDisabled ? 'text-green-500' : 'text-muted-foreground'}`} />
          </div>
        )}
      </div>
    </>
  );
}