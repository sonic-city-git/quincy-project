import { MapPin, Users } from "lucide-react";
import { EquipmentIcon } from "./EquipmentIcon";
import { CalendarEvent } from "@/types/events";
import { useSyncStatus } from "@/hooks/useSyncStatus";

interface EventCardIconsProps {
  event: CalendarEvent;
  isEditingDisabled: boolean;
  sectionTitle?: string;
}

export function EventCardIcons({
  event,
  isEditingDisabled,
  sectionTitle
}: EventCardIconsProps) {
  const showEquipmentIcon = event.type.needs_equipment;
  const { isSynced, isChecking } = useSyncStatus(event);

  return (
    <>
      <div className="flex justify-center items-center">
        <MapPin 
          className={`h-6 w-6 ${event.location ? 'text-green-500' : 'text-zinc-400'}`} 
        />
      </div>

      <div className="flex justify-center items-center">
        {showEquipmentIcon && (
          <EquipmentIcon
            isEditingDisabled={isEditingDisabled}
            sectionTitle={sectionTitle}
            isSynced={isSynced}
            isChecking={isChecking}
            eventId={event.id}
            projectId={event.project_id}
          />
        )}
      </div>

      <div className="flex justify-center items-center">
        {event.type.needs_crew && (
          <Users className={`h-6 w-6 ${isEditingDisabled ? 'text-green-500' : 'text-zinc-400'}`} />
        )}
      </div>
    </>
  );
}