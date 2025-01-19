import { MapPin, Users, Check, AlertOctagon } from "lucide-react";
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

      <div className="flex justify-center items-center gap-2">
        {hasProjectRoles && (
          <>
            <Users className="h-6 w-6 text-muted-foreground" />
            {!isCheckingCrew && (
              isCrewSynced ? (
                <Check className={cn(
                  "h-4 w-4",
                  "text-green-500"
                )} />
              ) : (
                <AlertOctagon className={cn(
                  "h-4 w-4",
                  "text-blue-500"
                )} />
              )
            )}
          </>
        )}
      </div>
    </>
  );
}