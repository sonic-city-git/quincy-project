import { CalendarEvent } from "@/types/events";
import { isBefore, startOfToday } from "date-fns";

export interface GroupedEvents {
  proposed: CalendarEvent[];
  confirmed: CalendarEvent[];
  invoice_ready: CalendarEvent[];
  cancelled: CalendarEvent[];
  pastEvents: CalendarEvent[];
}

export function groupEventsByStatus(events: CalendarEvent[]): GroupedEvents {
  const today = startOfToday();

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
    // Get past events - all invoiced events + past cancelled events
    pastEvents: events.filter(event => 
      event.status === 'invoiced' || 
      (event.status === 'cancelled' && isBefore(event.date, today))
    ).sort(sortByDate)
  };

  return groupedEvents;
}