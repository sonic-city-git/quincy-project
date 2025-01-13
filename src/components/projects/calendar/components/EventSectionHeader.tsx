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
import { useEffect } from "react";
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
  const sectionSyncStatus = useSectionSyncStatus(events);
  const queryClient = useQueryClient();

  // Subscribe to real-time updates for all project_event_equipment changes
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
          
          // Add a delay before invalidating queries
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

  const handleSyncAllEquipment = () => {
    try {
      const eventsWithEquipment = events.filter(event => event.type.needs_equipment);
      console.log(`Processing ${eventsWithEquipment.length} events for sync`);
      
      // Find all sync buttons in the section
      const syncButtons = document.querySelectorAll(`[data-sync-button][data-section="${title}"]`);
      console.log(`Found ${syncButtons.length} sync buttons`);
      
      if (syncButtons.length === 0) {
        console.log('No sync buttons found');
        return;
      }

      // Click each sync button
      syncButtons.forEach((button: Element) => {
        if (button instanceof HTMLElement) {
          console.log('Clicking sync button');
          button.click();
        }
      });

      toast.success(`Equipment synchronized for all ${title} events`);
    } catch (error) {
      console.error('Error syncing equipment:', error);
      toast.error('Failed to sync equipment');
    }
  };

  // Use a simpler layout for Done and Dusted section
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
        
        {/* Empty space for location icon */}
        <div />
        
        {/* Empty space */}
        <div />
        
        {/* Equipment icon column */}
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
                        sectionSyncStatus === 'synced' ? 'text-green-500' : 'text-blue-500'
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
        
        {/* Crew icon column */}
        <div className="flex items-center justify-center">
          {!isCancelled && !isInvoiceReady && eventType?.needs_crew && (
            <Users className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        {/* Event type column */}
        <div />

        {/* Revenue column */}
        <div />

        {/* Status manager column */}
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

        {/* Empty column for edit button alignment */}
        <div />
      </EventSectionHeaderGrid>
    </div>
  );
}