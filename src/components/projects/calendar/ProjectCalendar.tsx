
import { useCalendarDate } from "@/hooks/useCalendarDate";
import { useEventDialog } from "@/hooks/useEventDialog";
import { useEventTypes } from "@/hooks/useEventTypes";
import { useCalendarEvents } from "@/hooks/useConsolidatedEvents";
import { CalendarView } from "./CalendarView";
import { Card } from "@/components/ui/card";
import { CalendarEvent } from "@/types/events";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EventFormDialog, type EventFormData } from "../shared/EventFormDialog";

interface ProjectCalendarProps {
  projectId: string;
}

export function ProjectCalendar({ projectId }: ProjectCalendarProps) {
  const { currentDate, setCurrentDate } = useCalendarDate();
  const { data: eventTypes } = useEventTypes();
  // PERFORMANCE OPTIMIZATION: Use consolidated events hook with drag functionality
  const {
    events,
    isLoading,
    findEventOnDate,
    addEvent,
    updateEvent,
    deleteEvent
  } = useCalendarEvents(projectId);

  const {
    selectedDate,
    isAddDialogOpen,
    isEditDialogOpen,
    selectedEvent,
    openAddDialog,
    closeAddDialog,
    closeEditDialog,
    openEditDialog,
  } = useEventDialog();

  const handleDayClick = (date: Date) => {
    const existingEvent = findEventOnDate(date);


    if (existingEvent) {

      openEditDialog(existingEvent);
    } else {

      openAddDialog(date);
    }
  };

  const handleEditEvent = (event: CalendarEvent) => {

    openEditDialog(event);
  };

  const handleAddMultipleEvents = async (dates: Date[], name: string, eventType: any, status: CalendarEvent['status']) => {

    for (const date of dates) {
      await addEvent(date, name, eventType, status);
    }
  };

  // CONSOLIDATED: Event form handlers for both add and edit modes
  const handleEventFormSubmit = async (data: EventFormData) => {
    try {
      if (selectedEvent) {
        // Edit mode
        await updateEvent(selectedEvent, {
          name: data.name,
          type_id: data.typeId,
          status: data.status,
          location: data.location,
        });
        closeEditDialog();
      } else if (selectedDate) {
        // Add mode  
        const eventType = eventTypes?.find(t => t.id === data.typeId);
        if (eventType) {
          await addEvent(selectedDate, data.name, eventType, data.status);
          closeAddDialog();
        }
      }
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleEventDelete = async (event: CalendarEvent) => {
    try {
      await deleteEvent(event);
      closeEditDialog();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full p-6">
        <div className="h-[400px] flex items-center justify-center text-muted-foreground">
          Loading calendar...
        </div>
      </Card>
    );
  }

  if (!eventTypes) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="w-full space-y-8">
        <CalendarView
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          events={events || []}
          onDayClick={handleDayClick}
          eventTypes={eventTypes}
          onAddMultipleEvents={handleAddMultipleEvents}
          onEditEvent={handleEditEvent}
        />

        {/* CONSOLIDATED: Single event form dialog for both add and edit */}
        <EventFormDialog
          open={isAddDialogOpen || isEditDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              closeAddDialog();
              closeEditDialog();
            }
          }}
          mode={selectedEvent ? 'edit' : 'add'}
          title={selectedEvent ? 'Edit Event' : 'Add Event'}
          event={selectedEvent}
          selectedDate={selectedDate}
          eventTypes={eventTypes || []}
          onSubmit={handleEventFormSubmit}
          onDelete={selectedEvent ? handleEventDelete : undefined}
        />
      </div>
    </TooltipProvider>
  );
}
