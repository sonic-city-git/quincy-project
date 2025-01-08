import { useState, useEffect } from "react";
import { CalendarEvent, EventType } from "@/types/events";
import { useToast } from "@/hooks/use-toast";
import { formatDatabaseDate } from "@/utils/dateFormatters";
import { supabase } from "@/integrations/supabase/client";

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
        console.log('Loading events for project:', projectId);
        const { data, error } = await supabase
          .from('project_events')
          .select('*')
          .eq('project_id', projectId);

        if (error) throw error;

        console.log('Fetched events:', data);
        const fetchedEvents = data.map(event => ({
          date: new Date(event.date),
          name: event.name,
          type: event.type as EventType
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

    loadEvents();
  }, [projectId, toast]);

  const addEvent = async (date: Date, eventName: string, eventType: EventType) => {
    if (!projectId) {
      console.error('No project ID provided for adding event');
      throw new Error('Project ID is missing');
    }

    try {
      const formattedDate = formatDatabaseDate(date);
      console.log('Adding event to database:', {
        projectId,
        date: formattedDate,
        name: eventName,
        type: eventType
      });
      
      const { data, error } = await supabase
        .from('project_events')
        .insert({
          project_id: projectId,
          date: formattedDate,
          name: eventName.trim() || eventType,
          type: eventType
        })
        .select()
        .single();

      if (error) {
        console.error('Database error when adding event:', error);
        throw error;
      }

      console.log('Successfully added event:', data);
      const newEvent: CalendarEvent = {
        date: new Date(data.date),
        name: data.name,
        type: data.type as EventType
      };

      setEvents(prev => [...prev, newEvent]);
      
      toast({
        title: "Success",
        description: "Event added successfully",
      });

      return newEvent;
    } catch (error) {
      console.error('Error adding event:', error);
      toast({
        title: "Error",
        description: "Failed to add event",
        variant: "destructive",
      });
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
          name: updatedEvent.name.trim() || updatedEvent.type,
          type: updatedEvent.type
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

      toast({
        title: "Success",
        description: "Event updated successfully",
      });
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive",
      });
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