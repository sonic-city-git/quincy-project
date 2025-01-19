import { MapPin, Users } from "lucide-react";
import { EquipmentIcon } from "./EquipmentIcon";
import { CalendarEvent } from "@/types/events";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import { useSyncCrewStatus } from "@/hooks/useSyncCrewStatus";
import { cn } from "@/lib/utils";

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
  const { isSynced: isEquipmentSynced, isChecking: isCheckingEquipment, hasProjectEquipment } = useSyncStatus(event);
  const { hasProjectRoles, isSynced: isCrewSynced, isChecking: isCheckingCrew } = useSyncCrewStatus(event);

  return (
    <>
      <div className="flex justify-center items-center">
        <MapPin 
          className={`h-6 w-6 ${event.location ? 'text-green-500' : 'text-zinc-400'}`} 
        />
      </div>

      <div className="flex justify-center items-center">
        {showEquipmentIcon && hasProjectEquipment && (
          <EquipmentIcon
            isEditingDisabled={isEditingDisabled}
            sectionTitle={sectionTitle}
            isSynced={isEquipmentSynced}
            isChecking={isCheckingEquipment}
            eventId={event.id}
            projectId={event.project_id}
            hasProjectEquipment={hasProjectEquipment}
          />
        )}
      </div>

      <div className="flex justify-center items-center">
        {hasProjectRoles && (
          <Users 
            className={cn(
              "h-6 w-6",
              isCrewSynced ? "text-green-500" : "text-blue-500"
            )}
          />
        )}
      </div>
    </>
  );
}