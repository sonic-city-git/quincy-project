import { useState } from "react";
import { CalendarEvent, EventType } from "@/types/events";
import { useToast } from "@/hooks/use-toast";
import { createEvent, updateEvent } from "@/utils/eventQueries";
import { createRoleAssignments } from "@/utils/roleAssignments";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useEventManagement = (projectId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const checkMissingResources = async (eventType: EventType) => {
    const warnings = [];
    
    if (eventType.needs_crew) {
      const { data: projectRoles } = await supabase
        .from('project_roles')
        .select('id')
        .eq('project_id', projectId);
      
      if (!projectRoles?.length) {
        warnings.push("Consider setting up crew roles for better event management.");
      }
    }
    
    if (eventType.needs_equipment) {
      const { data: projectEquipment } = await supabase
        .from('project_equipment')
        .select('id')
        .eq('project_id', projectId);
      
      if (!projectEquipment?.length) {
        warnings.push("Consider assigning equipment for better event management.");
      }
    }
    
    return warnings;
  };

  const addEvent = async (date: Date, eventName: string, eventType: EventType, status: CalendarEvent['status'] = 'proposed') => {
    if (!projectId) {
      console.error('No project ID provided for adding event');
      throw new Error('Project ID is missing');
    }

    setIsLoading(true);
    try {
      // Check for missing resources but only show warnings, don't block creation
      const validationWarnings = await checkMissingResources(eventType);
      if (validationWarnings.length > 0) {
        toast({
          title: "Resource Setup Reminder",
          description: `Event created! ${validationWarnings.join(" ")} You can sync them later.`,
          variant: "default"
        });
      }

      console.log('Adding event:', { projectId, date, eventName, eventType, status });
      const eventData = await createEvent(projectId, date, eventName, eventType, status);
      
      // Sync crew roles if needed
      if (eventType.needs_crew) {
        try {
          await createRoleAssignments(projectId, eventData.id);
        } catch (error) {
          console.error('Error syncing crew roles:', error);
          toast({
            title: "Warning",
            description: "Event created but crew roles could not be synced. Please sync manually.",
            variant: "warning"
          });
        }
      }

      // Sync equipment if needed
      if (eventType.needs_equipment) {
        try {
          await supabase.rpc('sync_event_equipment', {
            p_event_id: eventData.id,
            p_project_id: projectId
          });
        } catch (error) {
          console.error('Error syncing equipment:', error);
          toast({
            title: "Warning",
            description: "Event created but equipment could not be synced. Please sync manually.",
            variant: "warning"
          });
        }
      }

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
      toast.error("Failed to create event");
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
