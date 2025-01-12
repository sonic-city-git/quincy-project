import { CalendarEvent, EventType } from "@/types/events";
import { EventList } from "./EventList";

interface CalendarViewProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  events: CalendarEvent[];
  onDayClick: (date: Date) => void;
  eventTypes: EventType[];
  onAddMultipleEvents: (dates: Date[], name: string, eventType: any, status: CalendarEvent['status']) => void;
  onEditEvent: (event: CalendarEvent) => void;
}

export function CalendarView({ 
  currentDate, 
  setCurrentDate, 
  events, 
  onDayClick,
  eventTypes,
  onAddMultipleEvents,
  onEditEvent
}: CalendarViewProps) {
  return (
    <EventList 
      events={events} 
      onStatusChange={() => {}} 
      onEdit={onEditEvent}
    />
  );
}