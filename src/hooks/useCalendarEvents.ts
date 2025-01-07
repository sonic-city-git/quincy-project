import { useState, useEffect } from "react";
import { CalendarEvent, EventType } from "@/types/events";

export const useCalendarEvents = (projectId: string | undefined) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const storedEvents = localStorage.getItem(`calendar-events-${projectId}`);
    if (storedEvents) {
      const parsedEvents = JSON.parse(storedEvents).map((event: any) => ({
        ...event,
        date: new Date(event.date)
      }));
      setEvents(parsedEvents);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      localStorage.setItem(`calendar-events-${projectId}`, JSON.stringify(events));
    }
  }, [events, projectId]);

  const addEvent = (date: Date, eventName: string, eventType: EventType) => {
    setEvents([...events, { 
      date, 
      name: eventName.trim() || eventType, 
      type: eventType 
    }]);
  };

  const updateEvent = (updatedEvent: CalendarEvent) => {
    const updatedEvents = events.map(event => 
      event.date.toDateString() === updatedEvent.date.toDateString() 
        ? { ...updatedEvent, name: updatedEvent.name.trim() || updatedEvent.type }
        : event
    );
    setEvents(updatedEvents);
  };

  const findEvent = (date: Date) => {
    return events.find(e => e.date.toDateString() === date.toDateString());
  };

  return {
    events,
    addEvent,
    updateEvent,
    findEvent
  };
};