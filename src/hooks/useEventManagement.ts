
import { useState } from "react";
import { CalendarEvent, EventType } from "@/types/events";
import { useToast } from "@/hooks/use-toast";
import { createEvent, updateEvent } from "@/utils/eventQueries";
import { createRoleAssignments } from "@/utils/roleAssignments";
import { useQueryClient } from "@tanstack/react-query";

export const useEventManagement = (projectId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addEvent = async (date: Date, eventName: string, eventType: EventType, status: CalendarEvent['status'] = 'proposed') => {
    if (!projectId) {
      console.error('No project ID provided for adding event');
      throw new Error('Project ID is missing');
    }

    setIsLoading(true);
    try {
      console.log('Adding event:', { projectId, date, eventName, eventType, status });
      const eventData = await createEvent(projectId, date, eventName, eventType, status);
      
      // Invalidate and refetch all related queries to ensure UI updates
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['calendar-events', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['project-event-roles'] }),
        queryClient.invalidateQueries({ queryKey: ['project-event-equipment'] })
      ]);

      console.log('Event created and queries invalidated:', eventData);
      return eventData;
    } catch (error) {
      console.error('Error adding event:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateEventHandler = async (updatedEvent: CalendarEvent) => {
    if (!projectId) throw new Error('Project ID is missing');

    setIsLoading(true);
    try {
      await updateEvent(projectId, updatedEvent);
      
      // Invalidate queries to refresh the UI
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['calendar-events', projectId] })
      ]);

      return updatedEvent;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    addEvent,
    updateEvent: updateEventHandler,
  };
};
