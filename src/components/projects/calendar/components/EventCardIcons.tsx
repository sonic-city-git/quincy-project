import { MapPin, Users } from "lucide-react";
import { EquipmentIcon } from "./EquipmentIcon";
import { CalendarEvent } from "@/types/events";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import { useSyncCrewStatus } from "@/hooks/useSyncCrewStatus";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";
import { EditCrewDialog } from "./crew/EditCrewDialog";
import { useProjectDetails } from "@/hooks/useProjectDetails";

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
  const { hasProjectRoles, isSynced: isCrewSynced, isChecking: isCheckingCrew, roles = [] } = useSyncCrewStatus(event);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { project } = useProjectDetails(event.project_id);

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
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={() => !isEditingDisabled && setShowEditDialog(true)}
                disabled={isEditingDisabled}
                className="disabled:opacity-50"
              >
                <Users 
                  className={cn(
                    "h-6 w-6",
                    isCrewSynced ? "text-green-500" : "text-blue-500"
                  )}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[300px]">
              <div className="space-y-2">
                <p className="font-medium">Crew Assignments</p>
                <div className="space-y-1">
                  {roles.map(role => (
                    <div key={role.id} className="text-sm flex justify-between gap-4">
                      <span>{role.name}:</span>
                      <span className="text-muted-foreground">
                        {role.assigned?.name || "Unassigned"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {showEditDialog && (
        <EditCrewDialog
          event={event}
          projectName={project?.name || ""}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        />
      )}
    </>
  );
}