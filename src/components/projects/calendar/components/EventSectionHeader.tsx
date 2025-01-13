import { CalendarEvent, EventType } from "@/types/events";
import { getStatusIcon } from "@/utils/eventFormatters";
import { EventSectionHeaderGrid } from "./EventSectionHeaderGrid";
import { Package, Users } from "lucide-react";
import { useSectionSyncStatus } from "../hooks/useSectionSyncStatus";
import { Button } from "@/components/ui/button";
import { EventStatusManager } from "../EventStatusManager";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
  const [syncStatus, setSyncStatus] = useState<Record<string, boolean>>({});
  const sectionSyncStatus = useSectionSyncStatus(events);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!events.length) return;

    const projectId = events[0].project_id;
    const channel = supabase
      .channel(`project-equipment-sync-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_event_equipment',
          filter: `project_id=eq.${projectId}`
        },
        async (payload) => {
          console.log('Received real-time update:', payload);
          
          setTimeout(async () => {
            const { data: allEvents } = await supabase
              .from('project_events')
              .select('id')
              .eq('project_id', projectId)
              .in('status', ['proposed', 'confirmed']);

            if (allEvents) {
              console.log('Invalidating queries for events:', allEvents);
              await Promise.all([
                ...allEvents.map(event => 
                  queryClient.invalidateQueries({ 
                    queryKey: ['project-event-equipment', event.id],
                    exact: true
                  })
                ),
                queryClient.invalidateQueries({ 
                  queryKey: ['events', projectId],
                  exact: true
                }),
                queryClient.invalidateQueries({ 
                  queryKey: ['calendar-events', projectId],
                  exact: true
                })
              ]);
            }
          }, 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [events, queryClient]);

  const handleSyncAllEquipment = async () => {
    if (!events.length) {
      console.log('No events to process');
      return;
    }

    try {
      console.log(`Processing ${events.length} events for sync`);
      
      for (const event of events) {
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

            // Update local sync status immediately
            setSyncStatus(prev => ({
              ...prev,
              [event.id]: true
            }));

            console.log(`Successfully synced equipment for event ${event.id}`);
          }
        } catch (eventError) {
          console.error(`Error syncing event ${event.id}:`, eventError);
          throw eventError;
        }
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events', events[0]?.project_id] }),
        queryClient.invalidateQueries({ queryKey: ['calendar-events', events[0]?.project_id] }),
        ...events.map(event => 
          queryClient.invalidateQueries({ 
            queryKey: ['project-event-equipment', event.id] 
          })
        )
      ]);

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
          <div className="h-6 w-6 flex items-center justify-center">
            {getStatusIcon(title.toLowerCase() as CalendarEvent['status'])}
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        
        <div />
        
        <div />
        
        <div className="flex items-center justify-center">
          {!isCancelled && !isInvoiceReady && eventType?.needs_equipment && (
            sectionSyncStatus !== 'no-equipment' ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 p-0"
                  >
                    <Package 
                      className={`h-6 w-6 ${
                        sectionSyncStatus === 'synced' || Object.values(syncStatus).every(Boolean)
                          ? 'text-green-500' 
                          : 'text-blue-500'
                      }`} 
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={handleSyncAllEquipment}>
                    Sync all equipment
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Package className="h-6 w-6 text-muted-foreground" />
            )
          )}
        </div>
        
        <div className="flex items-center justify-center">
          {!isCancelled && !isInvoiceReady && eventType?.needs_crew && (
            <Users className="h-6 w-6 text-muted-foreground" />
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