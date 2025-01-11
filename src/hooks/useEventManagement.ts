import { useState } from "react";
import { CalendarEvent, EventType } from "@/types/events";
import { useToast } from "@/hooks/use-toast";
import { createEvent, updateEvent } from "@/utils/eventQueries";
import { createRoleAssignments } from "@/utils/roleAssignments";

export const useEventManagement = (projectId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const addEvent = async (date: Date, eventName: string, eventType: EventType) => {
    if (!projectId) {
      console.error('No project ID provided for adding event');
      throw new Error('Project ID is missing');
    }

    setIsLoading(true);
    try {
      console.log('Adding event:', { projectId, date, eventName, eventType });
      const eventData = await createEvent(projectId, date, eventName, eventType);
      
      if (eventType.needs_crew) {
        console.log('Event needs crew, creating role assignments');
        await createRoleAssignments(projectId, eventData.id);
      }

      const newEvent: CalendarEvent = {
        date: new Date(eventData.date),
        name: eventData.name,
        type: eventData.event_types,
        status: eventData.status as CalendarEvent['status']
      };

      return newEvent;
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