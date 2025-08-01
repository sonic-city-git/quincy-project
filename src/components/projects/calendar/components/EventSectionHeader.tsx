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
      // Sync preferred crew for all events in this section  
      for (const event of events) {
        // Get project roles with preferred crew members
        const { data: projectRoles } = await supabase
          .from('project_roles')
          .select('*')
          .eq('project_id', event.project_id)
          .not('preferred_id', 'is', null);

        if (projectRoles && projectRoles.length > 0) {
          // Update event roles with preferred crew members
          for (const projectRole of projectRoles) {
            const { error } = await supabase
              .from('project_event_roles')
              .update({ crew_member_id: projectRole.preferred_id })
              .eq('event_id', event.id)
              .eq('role_id', projectRole.role_id)
              .is('crew_member_id', null); // Only update unassigned roles

            if (error) {
              console.error('Error syncing preferred crew for event:', event.id, error);
            }
          }
        }
      }

      // Invalidate queries to refresh the data
      await queryClient.invalidateQueries({ queryKey: ['events', events[0].project_id] });
      await queryClient.invalidateQueries({ queryKey: ['project-event-roles'] });
      toast.success('Preferred crew synced successfully');
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