import { CalendarEvent } from "@/types/events";
import { Card } from "@/components/ui/card";
import { EventSection } from "./EventSection";
import { EventDialog } from "./EventDialog";
import { InvoiceDialog } from "../invoice/InvoiceDialog";
import { useState } from "react";
import { useEventTypes } from "@/hooks/useEventTypes";
import { useEventDialog } from "@/hooks/useEventDialog";
import { useEventStatusChange } from "./hooks/useEventStatusChange";
import { groupEventsByStatus } from "./utils/eventGroups";

interface EventListProps {
  events: CalendarEvent[];
  projectId?: string;
  isLoading?: boolean;
}

export function EventList({ events = [], projectId, isLoading }: EventListProps) {
  const { data: eventTypes = [] } = useEventTypes();
  const { handleStatusChange } = useEventStatusChange(projectId);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  
  const { 
    isEditDialogOpen, 
    selectedEvent,
    openEditDialog,
    closeEditDialog
  } = useEventDialog();

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

  const { proposed, confirmed, invoice_ready, cancelled, pastEvents } = groupEventsByStatus(events);

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
        events={proposed}
        onStatusChange={handleStatusChange}
        onEdit={openEditDialog}
      />
      <EventSection 
        status="confirmed"
        events={confirmed}
        onStatusChange={handleStatusChange}
        onEdit={openEditDialog}
      />
      <EventSection 
        status="invoice ready"
        events={invoice_ready}
        onStatusChange={handleStatusChange}
        onEdit={openEditDialog}
      />
      <EventSection 
        status="cancelled"
        events={cancelled}
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