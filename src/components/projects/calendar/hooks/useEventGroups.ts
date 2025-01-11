import { CalendarEvent } from "@/types/events";
import { isBefore, startOfToday } from "date-fns";

export const useEventGroups = (events: CalendarEvent[]) => {
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
  };

  // Get past events for "Done and dusted" section - cancelled and invoiced events
  const pastEvents = events.filter(event => 
    isBefore(event.date, today) && 
    (event.status === 'cancelled' || event.status === 'invoiced')
  ).sort(sortByDate);

  return {
    groupedEvents,
    pastEvents
  };
};