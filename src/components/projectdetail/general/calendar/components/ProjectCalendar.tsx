import { CalendarView } from "./CalendarView";
import { useCalendarDate } from "@/hooks/useCalendarDate";
import { useEventTypes } from "@/hooks/useEventTypes";
import { useCalendarEvents } from "@/hooks/useConsolidatedEvents";
import { CalendarEvent, EventType } from "@/types/events";

interface ProjectCalendarProps {
  projectId: string;
}

export function ProjectCalendar({ projectId }: ProjectCalendarProps) {
  const { currentDate, setCurrentDate } = useCalendarDate();
  const { data: eventTypes = [] } = useEventTypes();
  
  // Use consolidated events hook with drag functionality
  const {
    events,
    addEvent,
    handleDragStart,
    handleDragEnter,
    selectedDates,
    resetSelection
  } = useCalendarEvents(projectId);

  const handleDayClick = async (date: Date) => {
    // Handle single day click - could add event creation logic here
    console.log('Day clicked:', date);
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
      resetSelection();
    } catch (error) {
      console.error('Error adding multiple events:', error);
    }
  };

  const handleEditEvent = (event: CalendarEvent) => {
    // Handle event editing - could open edit dialog
    console.log('Edit event:', event);
  };

  return (
    <CalendarView
      currentDate={currentDate}
      setCurrentDate={setCurrentDate}
      events={events}
      onDayClick={handleDayClick}
      eventTypes={eventTypes}
      onAddMultipleEvents={handleAddMultipleEvents}
      onEditEvent={handleEditEvent}
    />
  );
}