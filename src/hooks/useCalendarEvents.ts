import { useState, useEffect } from "react";
import { CalendarEvent, EventType } from "@/types/events";
import { useToast } from "@/hooks/use-toast";
import { fetchEvents, createEvent, updateEvent } from "@/utils/eventQueries";
import { createRoleAssignments } from "@/utils/roleAssignments";

export const useCalendarEvents = (projectId: string | undefined) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const loadEvents = async () => {
      if (!projectId) {
        console.error('No project ID provided for loading events');
        return;
      }

      try {
        const fetchedEvents = await fetchEvents(projectId);
        setEvents(fetchedEvents);
      } catch (error) {
        console.error('Error loading events:', error);
        toast({
          title: "Error",
          description: "Failed to load calendar events",
          variant: "destructive",
        });
      }
    };

    if (projectId) {
      loadEvents();
    }
  }, [projectId, toast]);

  const addEvent = async (date: Date, eventName: string, eventType: EventType) => {
    if (!projectId) {
      console.error('No project ID provided for adding event');
      throw new Error('Project ID is missing');
    }

    try {
      const eventData = await createEvent(projectId, date, eventName, eventType);
      
      if (eventType.needs_crew) {
        await createRoleAssignments(projectId, eventData.id);
      }

      const newEvent: CalendarEvent = {
        date: new Date(eventData.date),
        name: eventData.name,
        type: eventData.event_types
      };

      setEvents(prev => [...prev, newEvent]);
      return newEvent;
    } catch (error) {
      console.error('Error adding event:', error);
      throw error;
    }
  };

  const updateEventHandler = async (updatedEvent: CalendarEvent) => {
    if (!projectId) throw new Error('Project ID is missing');

    try {
      await updateEvent(projectId, updatedEvent);
      setEvents(prev => 
        prev.map(event => 
          event.date.getTime() === updatedEvent.date.getTime()
            ? updatedEvent
            : event
        )
      );
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  };

  const findEvent = (date: Date) => {
    return events.find(event => 
      event.date.getTime() === date.getTime()
    );
  };

  return {
    events,
    addEvent,
    updateEvent: updateEventHandler,
    findEvent
  };
};