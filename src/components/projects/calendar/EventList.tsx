import { CalendarEvent } from "@/types/events";
import { EventSection } from "./EventSection";
import { EventDialog } from "./EventDialog";
import { InvoiceDialog } from "../invoice/InvoiceDialog";
import { useState } from "react";
import { useEventTypes } from "@/hooks/useEventTypes";
import { useEventDialog } from "@/hooks/useEventDialog";
import { useEventStatusChange } from "./hooks/useEventStatusChange";
import { groupEventsByStatus } from "./utils/eventGroups";
import { useEventDeletion } from "@/hooks/useEventDeletion";
import { useEventUpdate } from "@/hooks/useEventUpdate";
import { EventListEmpty } from "./components/EventListEmpty";
import { EventListLoading } from "./components/EventListLoading";

interface EventListProps {
  events: CalendarEvent[];
  projectId?: string;
  isLoading?: boolean;
}

export function EventList({ events = [], projectId, isLoading }: EventListProps) {
  const { data: eventTypes = [] } = useEventTypes();
  const { handleStatusChange } = useEventStatusChange(projectId);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const { deleteEvent } = useEventDeletion(projectId);
  const { updateEvent } = useEventUpdate(projectId);
  
  const { 
    isEditDialogOpen, 
    selectedEvent,
    openEditDialog,
    closeEditDialog
  } = useEventDialog();

  if (isLoading) {
    return <EventListLoading />;
  }

  if (!events.length) {
    return <EventListEmpty />;
  }

  const { proposed, confirmed, invoice_ready, cancelled, pastEvents } = groupEventsByStatus(events);

  const handleDeleteEvent = async (event: CalendarEvent) => {
    const success = await deleteEvent(event);
    if (success) {
      closeEditDialog();
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
        onUpdateEvent={updateEvent}
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