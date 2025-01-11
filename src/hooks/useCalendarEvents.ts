import { useState, useEffect } from "react";
import { CalendarEvent } from "@/types/events";
import { useToast } from "@/hooks/use-toast";
import { fetchEvents } from "@/utils/eventQueries";
import { useEventManagement } from "./useEventManagement";

export const useCalendarEvents = (projectId: string | undefined) => {
  const [events, setEvents] = useState<CalendarEvent[]>();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { addEvent: addEventHandler, updateEvent: updateEventHandler } = useEventManagement(projectId || '');

  useEffect(() => {
    const loadEvents = async () => {
      if (!projectId) {
        console.error('No project ID provided for loading events');
        return;
      }

      setIsLoading(true);
      try {
        console.log('Loading events for project:', projectId);
        const fetchedEvents = await fetchEvents(projectId);
        setEvents(fetchedEvents);
      } catch (error) {
        console.error('Error loading events:', error);
        toast({
          title: "Error",
          description: "Failed to load calendar events",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      loadEvents();
    }
  }, [projectId, toast]);

  const addEvent = async (date: Date, eventName: string, eventType: EventType) => {
    const newEvent = await addEventHandler(date, eventName, eventType);
    setEvents(prev => [...(prev || []), newEvent]);
    return newEvent;
  };

  const updateEvent = async (updatedEvent: CalendarEvent) => {
    const updated = await updateEventHandler(updatedEvent);
    setEvents(prev => 
      prev?.map(event => 
        event.date.getTime() === updated.date.getTime()
          ? updated
          : event
      )
    );
  };

  const findEvent = (date: Date) => {
    return events?.find(event => 
      event.date.getTime() === date.getTime()
    );
  };

  return {
    events,
    isLoading,
    addEvent,
    updateEvent,
    findEvent
  };
};