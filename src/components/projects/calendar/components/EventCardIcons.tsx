import { MapPin, Users, RefreshCw } from "lucide-react";
import { CalendarEvent } from "@/types/events";
import { useEventSyncStatus } from "@/hooks/useConsolidatedSyncStatus";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EquipmentIcon } from "./EquipmentIcon";
import { CrewMemberSelectContent } from "@/components/crew/CrewMemberSelectContent";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCrew } from "@/hooks/useCrew";
import { useState } from "react";
import { useEventConflicts } from "@/hooks/useProjectConflicts";
import { SONIC_CITY_FOLDER_ID } from "@/constants/organizations";

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
  const [isCrewPopoverOpen, setIsCrewPopoverOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  // PERFORMANCE OPTIMIZATION: Use consistent folder ID for crew data
  const { crew } = useCrew(SONIC_CITY_FOLDER_ID);
  const showEquipmentIcon = event.type.needs_equipment;
  const showCrewIcon = event.type.needs_crew;
  
  // PERFORMANCE OPTIMIZATION: Use consolidated sync status instead of separate hooks
  const { isEquipmentSynced, isCrewSynced, hasProjectEquipment, hasProjectRoles, roles } = useEventSyncStatus(event);
  const isCheckingEquipment = false; // No loading with consolidated data
  const isChecking = false;

  // PERFORMANCE OPTIMIZATION: Use pre-calculated conflicts instead of individual queries
  const conflictData = useEventConflicts(event.id, event.date);

  // Handle syncing preferred crew
  const handleSyncPreferredCrew = async () => {
    if (!event.project_id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('sync_event_crew', {
        p_event_id: event.id,
        p_project_id: event.project_id
      });

      if (error) {
        console.error('Error syncing crew:', error);
        return;
      }

      // Invalidate queries to refresh UI
      await queryClient.invalidateQueries({ queryKey: ['crew-conflict-single', event.id] });
      await queryClient.invalidateQueries({ queryKey: ['crew-sync-status', event.id] });
      await queryClient.invalidateQueries({ queryKey: ['project-events'] });
      
      setIsCrewPopoverOpen(false);
    } catch (error) {
      console.error('Error in crew sync:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle manual crew assignment
  const handleAssignCrew = async (roleId: string, crewMemberId: string | null) => {
    try {
      const { error } = await supabase
        .from('project_event_roles')
        .update({ crew_member_id: crewMemberId || null })
        .eq('event_id', event.id)
        .eq('role_id', roleId);

      if (error) {
        console.error('Error assigning crew:', error);
        return;
      }

      // Invalidate queries to refresh UI
      await queryClient.invalidateQueries({ queryKey: ['crew-conflict-single', event.id] });
      await queryClient.invalidateQueries({ queryKey: ['crew-sync-status', event.id] });
      await queryClient.invalidateQueries({ queryKey: ['project-events'] });
    } catch (error) {
      console.error('Error in crew assignment:', error);
    }
  };

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
            eventDate={event.date.toISOString().split('T')[0]}
          />
        )}
      </div>

      <div className="flex justify-center items-center">
        {showCrewIcon && hasProjectRoles && (
          <Popover open={isCrewPopoverOpen} onOpenChange={setIsCrewPopoverOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 hover:bg-zinc-700/50"
                disabled={isEditingDisabled}
              >
                <Users 
                  className={cn(
                    "h-6 w-6",
                    // Priority: Red (conflicts) > Green (all assigned) > Blue (unassigned)
                    conflictData?.hasConflicts ? "text-red-500" :
                    isCrewSynced ? "text-green-500" : "text-blue-500"
                  )}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="center">
              <div className="space-y-4">
                {/* Header */}
                <div>
                  <h4 className="font-semibold text-sm">Crew Management</h4>
                  <p className="text-xs text-muted-foreground">
                    {roles.filter(r => r.assigned?.id).length}/{roles.length} assigned
                    {conflictData?.hasConflicts && " • Conflicts detected"}
                  </p>
                </div>

                {/* Sync Button */}
                <Button 
                  onClick={handleSyncPreferredCrew}
                  disabled={isLoading}
                  className="w-full"
                  size="sm"
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                  Sync Preferred Crew
                </Button>

                {/* Individual Role Assignments */}
                <div className="space-y-3">
                  <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Manual Assignment
                  </h5>
                  {roles.map((role) => (
                    <div key={role.id} className="space-y-1">
                      <label className="text-sm font-medium">{role.name}</label>
                      <Select
                        value={role.assigned?.id || ""}
                        onValueChange={(value) => handleAssignCrew(role.id, value || null)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select crew member" />
                        </SelectTrigger>
                        <CrewMemberSelectContent crew={crew || []} />
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </>
  );
}