import { CalendarEvent, EventType } from "@/types/events";
import { useToast } from "@/hooks/use-toast";
import { fetchEvents } from "@/utils/eventQueries";
import { useEventManagement } from "./useEventManagement";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const useCalendarEvents = (projectId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { addEvent: addEventHandler, updateEvent: updateEventHandler } = useEventManagement(projectId);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', projectId],
    queryFn: () => fetchEvents(projectId || ''),
    enabled: !!projectId
  });

  const addEvent = async (date: Date, eventName: string, eventType: EventType) => {
    const newEvent = await addEventHandler(date, eventName, eventType);
    
    // Update React Query cache
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