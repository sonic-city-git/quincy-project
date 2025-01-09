import { useState, useEffect } from "react";
import { CalendarEvent, EventType } from "@/types/events";
import { useToast } from "@/hooks/use-toast";
import { formatDatabaseDate } from "@/utils/dateFormatters";
import { supabase } from "@/integrations/supabase/client";

interface DatabaseEvent {
  project_id: string;
  date: string;
  name: string;
  event_type_id: string;
  event_types: {
    id: string;
    name: string;
    color: string;
    needs_crew: boolean;
    rate_multiplier: number;
  };
}

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
        const { data, error } = await supabase
          .from('project_events')
          .select(`
            *,
            event_types (
              id,
              name,
              color,
              needs_crew,
              rate_multiplier
            )
          `)
          .eq('project_id', projectId);

        if (error) throw error;

        const fetchedEvents = (data as DatabaseEvent[]).map(event => ({
          date: new Date(event.date),
          name: event.name,
          type: event.event_types
        }));

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
      const formattedDate = formatDatabaseDate(date);
      
      // First, insert the event
      const { data: eventData, error: eventError } = await supabase
        .from('project_events')
        .insert({
          project_id: projectId,
          date: formattedDate,
          name: eventName.trim() || eventType.name,
          event_type_id: eventType.id
        })
        .select(`
          *,
          event_types (
            id,
            name,
            color,
            needs_crew,
            rate_multiplier
          )
        `)
        .single();

      if (eventError) throw eventError;

      // If this event type needs crew, create role assignments
      if (eventType.needs_crew) {
        // First, get all project roles
        const { data: projectRoles, error: rolesError } = await supabase
          .from('project_roles')
          .select(`
            *,
            crew_roles (
              id,
              name,
              color
            )
          `)
          .eq('project_id', projectId);

        if (rolesError) throw rolesError;

        if (projectRoles && projectRoles.length > 0) {
          // Create role assignments for each project role
          const roleAssignments = projectRoles.map(role => ({
            project_id: projectId,
            event_id: eventData.id,
            role_id: role.role_id,
            daily_rate: role.daily_rate,
            hourly_rate: role.hourly_rate,
            crew_member_id: role.preferred_id // Include preferred crew member if set
          }));

          const { error: assignError } = await supabase
            .from('project_event_roles')
            .insert(roleAssignments);

          if (assignError) {
            console.error('Error creating role assignments:', assignError);
            throw assignError;
          }
        }
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

  const updateEvent = async (updatedEvent: CalendarEvent) => {
    if (!projectId) throw new Error('Project ID is missing');

    try {
      const formattedDate = formatDatabaseDate(updatedEvent.date);

      const { error } = await supabase
        .from('project_events')
        .update({
          name: updatedEvent.name.trim() || updatedEvent.type.name,
          event_type_id: updatedEvent.type.id
        })
        .eq('project_id', projectId)
        .eq('date', formattedDate);

      if (error) throw error;

      setEvents(prev => 
        prev.map(event => 
          formatDatabaseDate(event.date) === formatDatabaseDate(updatedEvent.date)
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
      formatDatabaseDate(event.date) === formatDatabaseDate(date)
    );
  };

  return {
    events,
    addEvent,
    updateEvent,
    findEvent
  };
};