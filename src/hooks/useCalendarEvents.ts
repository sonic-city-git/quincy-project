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
              color
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
      
      const { data, error } = await supabase
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
            color
          )
        `)
        .single();

      if (error) {
        console.error('Database error when adding event:', error);
        throw error;
      }

      const newEvent: CalendarEvent = {
        date: new Date(data.date),
        name: data.name,
        type: data.event_types
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