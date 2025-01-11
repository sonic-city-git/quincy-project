import { CalendarEvent } from "@/types/events";

export function useCalendarModifiers(events: CalendarEvent[] | undefined, selectedDates: Date[] = []) {
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
    selected: (date: Date) => {
      const normalizedDate = new Date(Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      ));
      return selectedDates.some(selectedDate => {
        const normalizedSelectedDate = new Date(Date.UTC(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate()
        ));
        return normalizedSelectedDate.getTime() === normalizedDate.getTime();
      });
    }
  };

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
    selected: {
      backgroundColor: '#3b82f680',
      color: '#FFFFFF',
      borderRadius: '8px',
      cursor: 'pointer'
    }
  };

  return { modifiers, modifiersStyles };
}