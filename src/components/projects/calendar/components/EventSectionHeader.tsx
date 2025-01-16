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
  
  // Set up sync subscriptions if we have events
  if (events.length > 0) {
    useSyncSubscriptions(events[0].project_id);
  }

  const handleSyncAllEquipment = async () => {
    if (!events.length) {
      console.log('No events to process');
      return;
    }

    try {
      console.log(`Processing ${events.length} events for sync`);
      const projectId = events[0].project_id;
      
      // Create sync operations for each event
      for (const event of events) {
        const { error: syncError } = await supabase
          .from('sync_operations')
          .insert({
            project_id: projectId,
            event_id: event.id,
            status: 'pending'
          });

        if (syncError) throw syncError;
      }

      // Process events in batches
      const batchSize = 5;
      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (event) => {
          try {
            const { data: projectEquipment } = await supabase
              .from('project_equipment')
              .select('*')
              .eq('project_id', event.project_id);

            if (projectEquipment && projectEquipment.length > 0) {
              const uniqueEquipment = new Map();
              
              projectEquipment.forEach(item => {
                if (uniqueEquipment.has(item.equipment_id)) {
                  const existing = uniqueEquipment.get(item.equipment_id);
                  existing.quantity += item.quantity;
                  uniqueEquipment.set(item.equipment_id, existing);
                } else {
                  uniqueEquipment.set(item.equipment_id, item);
                }
              });

              const eventEquipment = Array.from(uniqueEquipment.values()).map(item => ({
                project_id: event.project_id,
                event_id: event.id,
                equipment_id: item.equipment_id,
                quantity: item.quantity,
                group_id: item.group_id,
                is_synced: true
              }));

              const { error: deleteError } = await supabase
                .from('project_event_equipment')
                .delete()
                .eq('event_id', event.id);

              if (deleteError) throw deleteError;

              const { error: insertError } = await supabase
                .from('project_event_equipment')
                .insert(eventEquipment);

              if (insertError) throw insertError;

              // Update sync operation status
              const { error: updateError } = await supabase
                .from('sync_operations')
                .update({ status: 'completed' })
                .eq('event_id', event.id);

              if (updateError) throw updateError;

              console.log(`Successfully synced equipment for event ${event.id}`);
            }
          } catch (eventError) {
            console.error(`Error syncing event ${event.id}:`, eventError);
            
            // Update sync operation status with error
            const { error: updateError } = await supabase
              .from('sync_operations')
              .update({ 
                status: 'failed',
                error_message: eventError.message,
                attempts: 1
              })
              .eq('event_id', event.id);

            if (updateError) {
              console.error('Error updating sync operation:', updateError);
            }
            
            throw eventError;
          }
        }));
      }

      toast.success(`Equipment synchronized for all ${title} events`);
    } catch (error) {
      console.error('Error syncing equipment:', error);
      toast.error('Failed to sync equipment');
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
            />
          )}
        </div>
        
        <div className="flex items-center justify-center">
          {!isCancelled && !isInvoiceReady && (
            <HeaderCrewIcon needsCrew={eventType?.needs_crew ?? false} />
          )}
        </div>

        <div />

        <div />

        <div className="flex justify-center">
          {onStatusChange && (
            <EventStatusManager
              status={title.toLowerCase()}
              events={events}
              onStatusChange={onStatusChange}
              isCancelled={isCancelled}
            />
          )}
        </div>

        <div />
      </EventSectionHeaderGrid>
    </div>
  );
}