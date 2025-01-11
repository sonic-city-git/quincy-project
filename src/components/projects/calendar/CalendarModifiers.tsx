import { CalendarEvent } from "@/types/events";

export function useCalendarModifiers(events: CalendarEvent[] | undefined) {
  // Create a modifier for each event
  const modifiers = events?.reduce((acc, event) => {
    const eventDate = new Date(event.date);
    const key = `event-${eventDate.getTime()}`;
    return {
      ...acc,
      [key]: (date: Date) => {
        const normalizedDate = new Date(Date.UTC(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        ));
        return event.date.getTime() === normalizedDate.getTime();
      }
    };
  }, {} as Record<string, (date: Date) => boolean>) || {};

  // Create styles for each event
  const modifiersStyles = events?.reduce((acc, event) => {
    const eventDate = new Date(event.date);
    const key = `event-${eventDate.getTime()}`;
    return {
      ...acc,
      [key]: {
        backgroundColor: `${event.type.color}B3`, // B3 in hex is 70% opacity
        color: '#FFFFFF',
        borderRadius: '8px',
        cursor: 'pointer',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative' as const
      }
    };
  }, {} as Record<string, React.CSSProperties>) || {};

  return { modifiers, modifiersStyles };
}