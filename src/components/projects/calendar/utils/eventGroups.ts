import { CalendarEvent } from "@/types/events";
import { isPast } from "date-fns";

interface GroupedEvents {
  proposed: CalendarEvent[];
  confirmed: CalendarEvent[];
  ready: CalendarEvent[];
  cancelled: CalendarEvent[];
  doneAndDusted: CalendarEvent[];
}

const sortEventsByDate = (events: CalendarEvent[]) => {
  return [...events].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });
};

export function groupEventsByStatus(events: CalendarEvent[]): GroupedEvents {
  const groups = events.reduce(
    (groups, event) => {
      // Check if event should go to "Done and Dusted"
      const isInPast = isPast(new Date(event.date));
      const isDoneAndDusted = 
        event.status === "invoiced" || 
        (event.status === "cancelled" && isInPast);

      if (isDoneAndDusted) {
        groups.doneAndDusted.push(event);
      } else {
        // Regular grouping for other events
        switch (event.status) {
          case "proposed":
            groups.proposed.push(event);
            break;
          case "confirmed":
            groups.confirmed.push(event);
            break;
          case "invoice ready":
            groups.ready.push(event);
            break;
          case "cancelled":
            groups.cancelled.push(event);
            break;
        }
      }
      return groups;
    },
    {
      proposed: [],
      confirmed: [],
      ready: [],
      cancelled: [],
      doneAndDusted: []
    } as GroupedEvents
  );

  // Sort each group by date
  return {
    proposed: sortEventsByDate(groups.proposed),
    confirmed: sortEventsByDate(groups.confirmed),
    ready: sortEventsByDate(groups.ready),
    cancelled: sortEventsByDate(groups.cancelled),
    doneAndDusted: sortEventsByDate(groups.doneAndDusted)
  };
}