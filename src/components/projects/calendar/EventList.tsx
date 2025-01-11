import { CalendarEvent } from "@/types/events";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { EventSection } from "./EventSection";
import { format, isBefore, startOfToday } from "date-fns";

interface EventListProps {
  events: CalendarEvent[];
  projectId?: string;
}

export function EventList({ events, projectId }: EventListProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const today = startOfToday();

  // Group active events by status
  const activeEvents = events.filter(event => !isBefore(event.date, today));
  const groupedEvents = {
    proposed: activeEvents.filter(event => event.status === 'proposed'),
    confirmed: activeEvents.filter(event => event.status === 'confirmed'),
    invoice_ready: activeEvents.filter(event => event.status === 'invoice ready'),
    cancelled: activeEvents.filter(event => event.status === 'cancelled'),
  };

  // Get past events for "Done and dusted" section - only cancelled and invoiced events
  const pastEvents = events.filter(event => 
    isBefore(event.date, today) && 
    (event.status === 'cancelled' || event.status === 'invoiced')
  );

  const handleStatusChange = async (event: CalendarEvent, newStatus: CalendarEvent['status']) => {
    if (!projectId) return;

    const queryKeysToUpdate = [
      ['events', projectId],
      ['calendar-events', projectId]
    ];

    try {
      const updatedEvent = { ...event, status: newStatus };
      
      // Update all relevant caches optimistically
      queryKeysToUpdate.forEach(queryKey => {
        queryClient.setQueryData(queryKey, (oldData: CalendarEvent[] | undefined) => {
          if (!oldData) return [updatedEvent];
          return oldData.map(e => 
            e.date.getTime() === event.date.getTime() && e.name === event.name
              ? updatedEvent
              : e
          );
        });
      });

      // Update the server
      const { error } = await supabase
        .from('project_events')
        .update({ status: newStatus })
        .eq('date', format(event.date, 'yyyy-MM-dd'))
        .eq('name', event.name)
        .eq('project_id', projectId);

      if (error) throw error;

      const { dismiss } = toast({
        title: "Status Updated",
        description: `Event status changed to ${newStatus}`,
      });

      setTimeout(() => {
        dismiss();
      }, 600);

      await Promise.all(
        queryKeysToUpdate.map(queryKey =>
          queryClient.invalidateQueries({ queryKey })
        )
      );

    } catch (error) {
      console.error('Error updating event status:', error);
      
      queryKeysToUpdate.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      
      toast({
        title: "Error",
        description: "Failed to update event status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <EventSection 
        status="proposed"
        events={groupedEvents.proposed}
        onStatusChange={handleStatusChange}
      />
      <EventSection 
        status="confirmed"
        events={groupedEvents.confirmed}
        onStatusChange={handleStatusChange}
      />
      <EventSection 
        status="invoice ready"
        events={groupedEvents.invoice_ready}
        onStatusChange={handleStatusChange}
      />
      <EventSection 
        status="cancelled"
        events={groupedEvents.cancelled}
        onStatusChange={handleStatusChange}
      />
      {pastEvents.length > 0 && (
        <div className="border-t pt-8">
          <EventSection 
            status="done and dusted"
            events={pastEvents}
            onStatusChange={handleStatusChange}
          />
        </div>
      )}
    </div>
  );
}