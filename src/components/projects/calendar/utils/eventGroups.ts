import { CalendarEvent } from "@/types/events";

interface GroupedEvents {
  proposed: CalendarEvent[];
  confirmed: CalendarEvent[];
  ready: CalendarEvent[];
  cancelled: CalendarEvent[];
}

export function groupEventsByStatus(events: CalendarEvent[]): GroupedEvents {
  return events.reduce(
    (groups, event) => {
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
      return groups;
    },
    {
      proposed: [],
      confirmed: [],
      ready: [],
      cancelled: [],
    } as GroupedEvents
  );
}