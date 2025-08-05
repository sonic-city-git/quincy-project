import { useState } from "react";
import { CalendarView } from "./CalendarView";
import { useCalendarDate } from "@/hooks/useCalendarDate";
import { useEventTypes } from "@/hooks/useEventTypes";
import { useProjectEvents } from "@/hooks/useConsolidatedEvents";
import { CalendarEvent, EventType } from "@/types/events";
import { EventFormDialog, EventFormData } from "@/components/shared/dialogs/EventFormDialog";

interface ProjectCalendarProps {
  projectId: string;
}

export function ProjectCalendar({ projectId }: ProjectCalendarProps) {
  const { currentDate, setCurrentDate } = useCalendarDate();
  const { data: eventTypes = [] } = useEventTypes();
  
  // Use basic events hook (no drag functionality - CalendarView handles that internally)
  const { events, addEvent, updateEvent, deleteEvent } = useProjectEvents(projectId);

  // Single event dialog state
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const handleDayClick = async (date: Date) => {
    // Open single event creation dialog
    setSelectedDate(date);
    setSelectedEvent(null);
    setIsEventDialogOpen(true);
  };

  const handleAddMultipleEvents = async (
    dates: Date[], 
    name: string, 
    eventType: EventType, 
    status: CalendarEvent['status']
  ) => {
    try {
      // Add events for all selected dates
      for (const date of dates) {
        await addEvent(date, name, eventType, status);
      }
    } catch (error) {
      console.error('Error adding multiple events:', error);
    }
  };

  const handleEditEvent = (event: CalendarEvent) => {
    // Open event edit dialog
    setSelectedEvent(event);
    setSelectedDate(new Date(event.date));
    setIsEventDialogOpen(true);
  };

  const handleEventSubmit = async (formData: EventFormData) => {
    const eventType = eventTypes.find(type => type.id === formData.typeId);
    if (!eventType) throw new Error('Event type not found');

    if (selectedEvent) {
      // Edit existing event
      const updatedEvent: CalendarEvent = {
        ...selectedEvent,
        name: formData.name || eventType.name,
        type: eventType,
        status: formData.status,
        location: formData.location
      };
      await updateEvent(updatedEvent);
    } else if (selectedDate) {
      // Create new event
      await addEvent(
        selectedDate,
        formData.name || eventType.name,
        eventType,
        formData.status
      );
    }
  };

  const handleEventDelete = async (event: CalendarEvent) => {
    await deleteEvent(event);
  };

  return (
    <>
      <CalendarView
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        events={events}
        onDayClick={handleDayClick}
        eventTypes={eventTypes}
        onAddMultipleEvents={handleAddMultipleEvents}
        onEditEvent={handleEditEvent}
      />

      <EventFormDialog
        open={isEventDialogOpen}
        onOpenChange={setIsEventDialogOpen}
        mode={selectedEvent ? 'edit' : 'add'}
        event={selectedEvent}
        selectedDate={selectedDate}
        eventTypes={eventTypes}
        onSubmit={handleEventSubmit}
        onDelete={handleEventDelete}
      />
    </>
  );
}