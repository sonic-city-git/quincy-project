import { CalendarEvent } from "@/types/events";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { EventSection } from "./EventSection";
import { format, isBefore, startOfToday } from "date-fns";
import { useEventDialog } from "@/hooks/useEventDialog";
import { useEventTypes } from "@/hooks/useEventTypes";
import { EventDialog } from "./EventDialog";
import { InvoiceDialog } from "../invoice/InvoiceDialog";
import { useState } from "react";
import { Card } from "@/components/ui/card";

interface EventListProps {
  events: CalendarEvent[];
  projectId?: string;
  isLoading?: boolean;
}

export function EventList({ events = [], projectId, isLoading }: EventListProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const today = startOfToday();
  const { data: eventTypes = [] } = useEventTypes();
  const { 
    isEditDialogOpen, 
    selectedEvent,
    openEditDialog,
    closeEditDialog
  } = useEventDialog();
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="h-[200px] flex items-center justify-center text-muted-foreground">
          Loading events...
        </div>
      </Card>
    );
  }

  if (!events.length) {
    return (
      <Card className="p-6">
        <div className="h-[200px] flex items-center justify-center text-muted-foreground">
          No events found. Click on the calendar to add events.
        </div>
      </Card>
    );
  }

  // Sort function for events
  const sortByDate = (a: CalendarEvent, b: CalendarEvent) => {
    return a.date.getTime() - b.date.getTime();
  };

  // Group events by status, filtering cancelled events to only show future dates
  const groupedEvents = {
    proposed: events.filter(event => event.status === 'proposed').sort(sortByDate),
    confirmed: events.filter(event => event.status === 'confirmed').sort(sortByDate),
    invoice_ready: events.filter(event => event.status === 'invoice ready').sort(sortByDate),
    cancelled: events.filter(event => 
      event.status === 'cancelled' && 
      !isBefore(event.date, today)
    ).sort(sortByDate),
  };

  // Get past events for "Done and dusted" section - all invoiced events + past cancelled events
  const pastEvents = events.filter(event => 
    event.status === 'invoiced' || 
    (event.status === 'cancelled' && isBefore(event.date, today))
  ).sort(sortByDate);

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
            e.id === event.id ? updatedEvent : e
          );
        });
      });

      // Update the server
      const { error } = await supabase
        .from('project_events')
        .update({ status: newStatus })
        .eq('id', event.id)
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

  const handleUpdateEvent = async (updatedEvent: CalendarEvent) => {
    if (!projectId) return;

    try {
      const { error } = await supabase
        .from('project_events')
        .update({ 
          name: updatedEvent.name,
          event_type_id: updatedEvent.type.id,
          status: updatedEvent.status
        })
        .eq('id', updatedEvent.id)
        .eq('project_id', projectId);

      if (error) throw error;

      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ['events', projectId] });
      await queryClient.invalidateQueries({ queryKey: ['calendar-events', projectId] });

      toast({
        title: "Event Updated",
        description: "The event has been successfully updated",
      });
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = async (event: CalendarEvent) => {
    if (!projectId) return;

    try {
      const { error } = await supabase
        .from('project_events')
        .delete()
        .eq('id', event.id)
        .eq('project_id', projectId);

      if (error) throw error;

      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ['events', projectId] });
      await queryClient.invalidateQueries({ queryKey: ['calendar-events', projectId] });

      toast({
        title: "Event Deleted",
        description: "The event has been successfully deleted",
      });

      closeEditDialog();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event",
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
        onEdit={openEditDialog}
      />
      <EventSection 
        status="confirmed"
        events={groupedEvents.confirmed}
        onStatusChange={handleStatusChange}
        onEdit={openEditDialog}
      />
      <EventSection 
        status="invoice ready"
        events={groupedEvents.invoice_ready}
        onStatusChange={handleStatusChange}
        onEdit={openEditDialog}
      />
      <EventSection 
        status="cancelled"
        events={groupedEvents.cancelled}
        onStatusChange={handleStatusChange}
        onEdit={openEditDialog}
      />
      {pastEvents.length > 0 && (
        <div className="border-t pt-8">
          <EventSection 
            status="done and dusted"
            events={pastEvents}
            onStatusChange={handleStatusChange}
            onEdit={openEditDialog}
          />
        </div>
      )}

      <EventDialog
        isOpen={isEditDialogOpen}
        onClose={closeEditDialog}
        event={selectedEvent}
        eventTypes={eventTypes}
        onUpdateEvent={handleUpdateEvent}
        onDeleteEvent={handleDeleteEvent}
      />

      <InvoiceDialog 
        isOpen={isInvoiceDialogOpen}
        onClose={() => setIsInvoiceDialogOpen(false)}
        events={events}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}