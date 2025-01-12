import { useCalendarDate } from "@/hooks/useCalendarDate";
import { useEventDialog } from "@/hooks/useEventDialog";
import { useEventTypes } from "@/hooks/useEventTypes";
import { EventDialog } from "./EventDialog";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useCallback } from "react";
import { CalendarView } from "./CalendarView";
import { Card } from "@/components/ui/card";
import { CalendarEvent } from "@/types/events";

interface ProjectCalendarProps {
  projectId: string;
}

export function ProjectCalendar({ projectId }: ProjectCalendarProps) {
  const { currentDate, setCurrentDate } = useCalendarDate();
  const { data: eventTypes } = useEventTypes();
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

  const handleDayClick = useCallback((date: Date) => {
    const existingEvent = findEventOnDate(date);
    console.log('Calendar day clicked', { date, existingEvent });

    if (existingEvent) {
      console.log('Opening edit dialog for event:', existingEvent);
      openEditDialog(existingEvent);
    } else {
      console.log('Opening add dialog for date:', date);
      openAddDialog(date);
    }
  }, [findEventOnDate, openEditDialog, openAddDialog]);

  const handleAddMultipleEvents = async (dates: Date[], name: string, eventType: any, status: CalendarEvent['status']) => {
    for (const date of dates) {
      await addEvent(date, name, eventType, status);
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
    <div className="w-full space-y-8">
      <CalendarView
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        events={events || []}
        onDayClick={handleDayClick}
        eventTypes={eventTypes}
        onAddMultipleEvents={handleAddMultipleEvents}
        onEditEvent={openEditDialog}
      />

      <EventDialog
        isOpen={isAddDialogOpen}
        onClose={closeAddDialog}
        date={selectedDate}
        eventTypes={eventTypes}
        onAddEvent={addEvent}
      />

      <EventDialog
        isOpen={isEditDialogOpen}
        onClose={closeEditDialog}
        event={selectedEvent}
        eventTypes={eventTypes}
        onUpdateEvent={updateEvent}
        onDeleteEvent={deleteEvent}
      />
    </div>
  );
}