import { createContext, useContext, ReactNode } from 'react';
import { CalendarEvent, EventType } from '@/types/events';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';

interface EventsContextType {
  events: CalendarEvent[];
  addEvent: (date: Date, eventName: string, eventType: EventType) => Promise<void>;
  updateEvent: (event: CalendarEvent) => Promise<void>;
  findEvent: (date: Date) => CalendarEvent | undefined;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function EventsProvider({ children, projectId }: { children: ReactNode; projectId: string }) {
  const { events, addEvent, updateEvent, findEvent } = useCalendarEvents(projectId);

  return (
    <EventsContext.Provider value={{ events, addEvent, updateEvent, findEvent }}>
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
}