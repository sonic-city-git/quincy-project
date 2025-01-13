import { MapPin, Users } from "lucide-react";
import { EquipmentIcon } from "./EquipmentIcon";
import { CalendarEvent } from "@/types/events";

interface EventCardIconsProps {
  event: CalendarEvent;
  isSynced: boolean;
  isEditingDisabled: boolean;
  onViewEquipment: () => void;
  onSyncEquipment: () => void;
  sectionTitle?: string;
}

export function EventCardIcons({
  event,
  isSynced,
  isEditingDisabled,
  onViewEquipment,
  onSyncEquipment,
  sectionTitle
}: EventCardIconsProps) {
  return (
    <>
      <div className="flex justify-center items-center">
        <MapPin 
          className={`h-6 w-6 ${event.location ? 'text-green-500' : 'text-muted-foreground'}`} 
        />
      </div>

      <div className="flex justify-center items-center">
        {event.type.needs_equipment && (
          <EquipmentIcon
            isSynced={isSynced}
            isEditingDisabled={isEditingDisabled}
            onViewEquipment={onViewEquipment}
            onSyncEquipment={onSyncEquipment}
            sectionTitle={sectionTitle}
          />
        )}
      </div>

      <div className="flex justify-center items-center">
        {event.type.needs_crew && (
          <Users className={`h-6 w-6 ${isEditingDisabled ? 'text-green-500' : 'text-muted-foreground'}`} />
        )}
      </div>
    </>
  );
}