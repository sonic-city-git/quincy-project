import { EventSectionHeaderGrid } from "./EventSectionHeaderGrid";
import { CalendarEvent, EventType } from "@/types/events";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { EventStatusManager } from "../EventStatusManager";
import { useSectionSyncStatus } from "../hooks/useSectionSyncStatus";
import { useSyncSubscriptions } from "@/hooks/useSyncSubscriptions";
import { StatusIcon } from "./header/StatusIcon";
import { HeaderEquipmentIcon } from "./header/HeaderEquipmentIcon";
import { HeaderCrewIcon } from "./header/HeaderCrewIcon";
import { EquipmentSyncOptionsDialog } from "./equipment/EquipmentSyncOptionsDialog";
import { useEffect, useState } from "react";
import { useEquipmentSync } from "@/hooks/useEquipmentSync";

interface EventSectionHeaderProps {
  title: string;
  eventType?: EventType;
  events?: CalendarEvent[];
  onStatusChange?: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
}

export function EventSectionHeader({ 
  title, 
  eventType,
  events = [],
  onStatusChange 
}: EventSectionHeaderProps) {
  const isCancelled = title.toLowerCase() === 'cancelled';
  const isInvoiceReady = title.toLowerCase() === 'invoice ready';
  const isDoneAndDusted = title.toLowerCase() === 'done and dusted';
  const sectionSyncStatus = useSectionSyncStatus(events);
  const queryClient = useQueryClient();
  const [hasProjectEquipment, setHasProjectEquipment] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const { syncEvents, isSyncing } = useEquipmentSync();
  
  // Set up sync subscriptions if we have events
  if (events.length > 0) {
    useSyncSubscriptions(events[0].project_id);
  }

  useEffect(() => {
    const checkProjectEquipment = async () => {
      if (events.length > 0) {
        const { data } = await supabase
          .from('project_equipment')
          .select('id')
          .eq('project_id', events[0].project_id)
          .limit(1);
        
        setHasProjectEquipment(!!data && data.length > 0);
      }
    };

    checkProjectEquipment();
  }, [events]);

  const handleShowSyncDialog = () => {
    if (!events || events.length === 0) {
      toast.error("No events to sync");
      return;
    }
    setShowSyncDialog(true);
  };

  const syncEventsToEquipment = async (eventsToSync: CalendarEvent[], syncType: 'all' | 'future' | 'date-based') => {
    if (!eventsToSync.length) return;

    // Prevent concurrent sync operations
    if (isSyncing) {
      console.log('🚫 [GROUP-SYNC] Sync already in progress, skipping...');
      return;
    }

    console.log(`🔄 [GROUP-SYNC] Starting ${syncType} sync for ${eventsToSync.length} events`);
    
    // Use unified sync hook
    const success = await syncEvents(
      eventsToSync.map(event => ({ id: event.id, project_id: event.project_id }))
    );

    if (success) {
      let message = '';
      switch (syncType) {
        case 'all':
          message = `Equipment synced to all ${eventsToSync.length} events`;
          break;
        case 'future':
          message = `Equipment synced to ${eventsToSync.length} future events`;
          break;
        case 'date-based':
          message = `Equipment synced to ${eventsToSync.length} events from selected date`;
          break;
      }
      // Don't show duplicate toast - the hook already shows success message
      console.log('✅ [GROUP-SYNC]', message);
    }
  };

  const handleSyncAllEquipment = async () => {
    await syncEventsToEquipment(events, 'all');
  };

  const handleSyncFromDate = async (fromDate: Date) => {
    const eventsFromDate = events.filter(event => {
      try {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        const compareDate = new Date(fromDate);
        compareDate.setHours(0, 0, 0, 0);
        return eventDate >= compareDate;
      } catch {
        return false;
      }
    });
    
    await syncEventsToEquipment(eventsFromDate, 'date-based');
  };

  const handleSyncPreferredCrew = async () => {
    if (!events.length) return;

    try {
      let totalAssigned = 0;
      let totalConflicts = 0;

      // Process each event separately
      for (const event of events) {
        // Step 1: Create event roles if they don't exist (this auto-assigns preferred crew)
        const { createRoleAssignments } = await import('@/utils/roleAssignments');
        const createdRoles = await createRoleAssignments(event.project_id, event.id);
        
        if (createdRoles.length > 0) {
          
          // Check for conflicts in the newly created assignments
          const { checkMultipleCrewConflicts } = await import('@/utils/crewConflictDetection');
          const conflictChecks = createdRoles
            .filter(role => role.crew_member_id) // Only check assigned roles
            .map(role => ({
              crewMemberId: role.crew_member_id,
              date: event.date
            }));

          if (conflictChecks.length > 0) {
            const conflictResults = await checkMultipleCrewConflicts(conflictChecks);
            const conflictsFound = Array.from(conflictResults.values()).filter(result => result.hasConflict);
            
            if (conflictsFound.length > 0) {
              
              // Remove crew assignments that have conflicts
              for (const role of createdRoles) {
                if (role.crew_member_id) {
                  const conflictResult = conflictResults.get(role.crew_member_id);
                  if (conflictResult?.hasConflict) {
                    await supabase
                      .from('project_event_roles')
                      .update({ crew_member_id: null })
                      .eq('id', role.id);
                    totalConflicts++;
                  } else {
                    totalAssigned++;
                  }
                }
              }
            } else {
              totalAssigned += createdRoles.filter(role => role.crew_member_id).length;
            }
          } else {
            totalAssigned += createdRoles.filter(role => role.crew_member_id).length;
          }
        } else {
          // Step 2: Handle existing unassigned roles
          const { data: existingEventRoles } = await supabase
            .from('project_event_roles')
            .select(`
              id,
              role_id,
              crew_member_id,
              project_roles!inner (
                preferred_id,
                preferred_crew:crew_members!preferred_id (
                  id,
                  name
                )
              )
            `)
            .eq('event_id', event.id)
            .is('crew_member_id', null) // Only unassigned roles
            .not('project_roles.preferred_id', 'is', null); // Only roles with preferred crew
          
          if (existingEventRoles?.length > 0) {
            // Check for conflicts in preferred crew assignments
            const { checkMultipleCrewConflicts } = await import('@/utils/crewConflictDetection');
            const conflictChecks = existingEventRoles.map(role => ({
              crewMemberId: role.project_roles.preferred_id,
              date: event.date
            }));
            
            const conflictResults = await checkMultipleCrewConflicts(conflictChecks);
            
            // Assign non-conflicted preferred crew
            for (const role of existingEventRoles) {
              const conflictResult = conflictResults.get(role.project_roles.preferred_id);
              if (conflictResult?.hasConflict) {
                totalConflicts++;
              } else {
                await supabase
                  .from('project_event_roles')
                  .update({ crew_member_id: role.project_roles.preferred_id })
                  .eq('id', role.id);
                totalAssigned++;
              }
            }
          }
        }
      }

      // Invalidate queries to refresh the data
      await queryClient.invalidateQueries({ queryKey: ['events', events[0].project_id] });
      await queryClient.invalidateQueries({ queryKey: ['project-event-roles'] });
      await queryClient.invalidateQueries({ queryKey: ['crew-sync-status'] });
      
      // Invalidate HeaderCrewIcon specific queries
      await queryClient.invalidateQueries({ queryKey: ['event-roles'] });
      await queryClient.invalidateQueries({ queryKey: ['crew-conflicts'] });
      
      // Invalidate individual event crew status queries
      for (const event of events) {
        await queryClient.invalidateQueries({ queryKey: ['crew-sync-status', event.id] });
        await queryClient.invalidateQueries({ queryKey: ['crew-conflict-single', event.id] });
      }

      // Provide feedback
      if (totalAssigned > 0 && totalConflicts === 0) {
        toast.success(`✅ Assigned ${totalAssigned} preferred crew members`);
      } else if (totalAssigned > 0 && totalConflicts > 0) {
        toast.warning(`⚠️ Assigned ${totalAssigned}, but ${totalConflicts} had conflicts`);
      } else if (totalConflicts > 0) {
        toast.error(`❌ All ${totalConflicts} preferred crew members have scheduling conflicts`);
      } else {
        toast.info('All preferred crew are already assigned');
      }

    } catch (error) {
      console.error('Error in handleSyncPreferredCrew:', error);
      toast.error('Failed to sync preferred crew');
    }
  };

  if (isDoneAndDusted) {
    return null;
  }

  return (
    <div className="p-3 mb-4">
      <EventSectionHeaderGrid>
        <div className="col-span-2 flex items-center gap-2 justify-start">
          <StatusIcon status={title.toLowerCase() as CalendarEvent['status']} />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        
        <div />
        
        <div />
        
        <div className="flex items-center justify-center">
          {!isCancelled && !isInvoiceReady && eventType?.needs_equipment && (
            <HeaderEquipmentIcon 
              sectionSyncStatus={isSyncing ? 'syncing' : sectionSyncStatus} 
              onSyncAllEquipment={handleShowSyncDialog}
              sectionTitle={title}
              hasProjectEquipment={hasProjectEquipment}
            />
          )}
        </div>
        
        <div className="flex items-center justify-center">
          {!isCancelled && !isInvoiceReady && eventType?.needs_crew && (
            <HeaderCrewIcon 
              events={events} 
              onSyncPreferredCrew={handleSyncPreferredCrew}
            />
          )}
        </div>

        <div />

        <div className="flex items-center justify-center">
          {onStatusChange && (
            <EventStatusManager
              status={title.toLowerCase()}
              events={events}
              onStatusChange={onStatusChange}
              isCancelled={isCancelled}
            />
          )}
        </div>

        <div className="flex justify-end text-sm text-muted-foreground">
          Equipment
        </div>

        <div className="flex justify-end text-sm text-muted-foreground">
          Crew
        </div>

        <div className="flex justify-end text-sm font-medium">
          Total
        </div>
      </EventSectionHeaderGrid>

      {/* Equipment Sync Options Dialog */}
      <EquipmentSyncOptionsDialog
        open={showSyncDialog}
        onOpenChange={setShowSyncDialog}
        sectionTitle={title}
        events={events}
        onSyncAll={handleSyncAllEquipment}
        onSyncFromDate={handleSyncFromDate}
      />
    </div>
  );
}