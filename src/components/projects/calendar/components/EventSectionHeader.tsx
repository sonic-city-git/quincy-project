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
import { useEffect, useState } from "react";

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

  const handleSyncAllEquipment = async () => {
    if (!events.length) return;

    try {
      // Sync equipment for all events in this section
      for (const event of events) {
        const { error } = await supabase.rpc('sync_event_equipment', {
          p_event_id: event.id,
          p_project_id: event.project_id
        });

        if (error) {
          console.error('Error syncing equipment for event:', event.id, error);
          toast.error(`Failed to sync equipment for event ${event.name}`);
          return;
        }
      }

      // Invalidate queries to refresh the data
      console.log('🔄 [GROUP-SYNC] Invalidating queries to update event icons...');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events', events[0].project_id] }),
        queryClient.invalidateQueries({ queryKey: ['sync-status'] }), // Critical: update individual event icons
        queryClient.invalidateQueries({ queryKey: ['project-event-equipment'] })
      ]);
      console.log('✅ [GROUP-SYNC] Queries invalidated, event icons should update');
      toast.success('Equipment synced successfully');
    } catch (error) {
      console.error('Error in handleSyncAllEquipment:', error);
      toast.error('Failed to sync equipment');
    }
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
              sectionSyncStatus={sectionSyncStatus} 
              onSyncAllEquipment={handleSyncAllEquipment}
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
    </div>
  );
}