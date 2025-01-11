import { CalendarEvent } from "@/types/events";

export function useCalendarModifiers(events: CalendarEvent[] | undefined, selectedDates: Date[] = []) {
  // Create a modifier for each event
  const modifiers = {
    ...events?.reduce((acc, event) => {
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
    }, {} as Record<string, (date: Date) => boolean>),
    // Add modifier for selected dates during drag
    selected: (date: Date) => {
      const normalizedDate = new Date(Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      ));
      return selectedDates.some(selectedDate => 
        selectedDate.getTime() === normalizedDate.getTime()
      );
    }
  };

  // Create styles for each event and selected dates
  const modifiersStyles = {
    ...events?.reduce((acc, event) => {
      const eventDate = new Date(event.date);
      const key = `event-${eventDate.getTime()}`;
      return {
        ...acc,
        [key]: {
          backgroundColor: `${event.type.color}D9`,
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
    }, {} as Record<string, React.CSSProperties>),
    // Add styles for selected dates
    selected: {
      backgroundColor: '#3b82f680',
      color: '#FFFFFF',
      borderRadius: '8px',
      cursor: 'pointer'
    }
  };

  return { modifiers, modifiersStyles };
}