import { useState, useEffect } from "react";
import { CalendarEvent, EventType } from "@/types/events";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useCalendarEvents = (projectId: string | undefined) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchEvents = async () => {
      if (!projectId) return;

      const { data, error } = await supabase
        .from('project_events')
        .select('*')
        .eq('project_id', projectId);

      if (error) {
        console.error('Error fetching events:', error);
        toast({
          title: "Error",
          description: "Failed to load calendar events",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        console.log('Fetched events:', data);
        const parsedEvents = data.map(event => ({
          date: new Date(event.date),
          name: event.name,
          type: event.type as EventType
        }));
        setEvents(parsedEvents);
      }
    };

    fetchEvents();
  }, [projectId, toast]);

  const addEvent = async (date: Date, eventName: string, eventType: EventType) => {
    if (!projectId) {
      console.error('No project ID provided');
      toast({
        title: "Error",
        description: "Project ID is missing",
        variant: "destructive",
      });
      return;
    }

    // Format date to YYYY-MM-DD using UTC
    const formattedDate = new Date(date.getTime())
      .toISOString()
      .split('T')[0];
    
    console.log('Adding event:', {
      project_id: projectId,
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
      console.error('Error adding event:', error);
      toast({
        title: "Error",
        description: "Failed to save event",
        variant: "destructive",
      });
      return;
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
  };

  const updateEvent = async (updatedEvent: CalendarEvent) => {
    if (!projectId) return;

    const formattedDate = new Date(updatedEvent.date.getTime())
      .toISOString()
      .split('T')[0];

    const { error } = await supabase
      .from('project_events')
      .update({
        name: updatedEvent.name.trim() || updatedEvent.type,
        type: updatedEvent.type
      })
      .eq('project_id', projectId)
      .eq('date', formattedDate);

    if (error) {
      console.error('Error updating event:', error);
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive",
      });
      return;
    }

    setEvents(prev => prev.map(event => 
      event.date.toDateString() === updatedEvent.date.toDateString() 
        ? { ...updatedEvent, name: updatedEvent.name.trim() || updatedEvent.type }
        : event
    ));

    toast({
      title: "Success",
      description: "Event updated successfully",
    });
  };

  const findEvent = (date: Date) => {
    return events.find(e => e.date.toDateString() === date.toDateString());
  };

  return {
    events,
    addEvent,
    updateEvent,
    findEvent
  };
};