import { useState, useEffect } from "react";
import { CalendarEvent, EventType } from "@/types/events";
import { useToast } from "@/hooks/use-toast";
import { fetchEvents } from "@/utils/eventQueries";
import { useEventManagement } from "./useEventManagement";
import { useQueryClient } from "@tanstack/react-query";

export const useCalendarEvents = (projectId: string | undefined) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { addEvent: addEventHandler, updateEvent: updateEventHandler } = useEventManagement(projectId);

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
        
        // Update the React Query cache with the fetched events
        queryClient.setQueryData(['events', projectId], fetchedEvents);
        queryClient.setQueryData(['calendar-events', projectId], fetchedEvents);
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
  }, [projectId, toast, queryClient]);

  const addEvent = async (date: Date, eventName: string, eventType: EventType) => {
    const newEvent = await addEventHandler(date, eventName, eventType);
    
    // Update both local state and React Query cache
    setEvents(prev => [...prev, newEvent]);
    queryClient.setQueryData(['events', projectId], (old: CalendarEvent[] | undefined) => 
      old ? [...old, newEvent] : [newEvent]
    );
    queryClient.setQueryData(['calendar-events', projectId], (old: CalendarEvent[] | undefined) => 
      old ? [...old, newEvent] : [newEvent]
    );
    
    return newEvent;
  };

  const updateEvent = async (updatedEvent: CalendarEvent) => {
    const updated = await updateEventHandler(updatedEvent);
    
    // Update both local state and React Query cache
    setEvents(prev => 
      prev.map(event => 
        event.date.getTime() === updated.date.getTime()
          ? updated
          : event
      )
    );
    
    // Update React Query cache for both query keys
    const updateCache = (old: CalendarEvent[] | undefined) => 
      old?.map(event => 
        event.date.getTime() === updated.date.getTime()
          ? updated
          : event
      ) || [];

    queryClient.setQueryData(['events', projectId], updateCache);
    queryClient.setQueryData(['calendar-events', projectId], updateCache);
  };

  const findEvent = (date: Date) => {
    return events.find(event => 
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