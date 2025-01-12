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
      <div className="flex items-center justify-center my-auto">
        <div className="h-8 w-8 flex items-center justify-center">
          <MapPin 
            className={`h-5 w-5 ${event.location ? 'text-green-500' : 'text-muted-foreground'}`} 
          />
        </div>
      </div>

      <div className="flex items-center justify-center my-auto">
        {event.type.needs_equipment && (
          <div className="h-8 w-8 flex items-center justify-center">
            <EquipmentIcon
              isSynced={isSynced}
              isEditingDisabled={isEditingDisabled}
              onViewEquipment={onViewEquipment}
              onSyncEquipment={onSyncEquipment}
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-center my-auto">
        {event.type.needs_crew && (
          <div className="h-8 w-8 flex items-center justify-center">
            <Users className={`h-5 w-5 ${isEditingDisabled ? 'text-green-500' : 'text-muted-foreground'}`} />
          </div>
        )}
      </div>
    </>
  );
}