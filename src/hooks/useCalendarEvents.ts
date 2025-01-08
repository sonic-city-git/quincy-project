import { useState, useEffect } from "react";
import { CalendarEvent, EventType } from "@/types/events";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCalendarDate } from "@/hooks/useCalendarDate";

export const useCalendarEvents = (projectId: string | undefined) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const { toast } = useToast();
  const { normalizeDate } = useCalendarDate();

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
      throw new Error('Project ID is missing');
    }

    // Format date to YYYY-MM-DD for PostgreSQL date column
    const formattedDate = normalizeDate(date).toISOString().split('T')[0];
    
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
        description: "Failed to add event",
        variant: "destructive",
      });
      throw error;
    }

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
  };

  const updateEvent = async (updatedEvent: CalendarEvent) => {
    if (!projectId) throw new Error('Project ID is missing');

    const formattedDate = normalizeDate(updatedEvent.date).toISOString().split('T')[0];

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
      throw error;
    }

    setEvents(prev => 
      prev.map(event => 
        normalizeDate(event.date).toDateString() === normalizeDate(updatedEvent.date).toDateString()
          ? { ...updatedEvent, name: updatedEvent.name.trim() || updatedEvent.type }
          : event
      )
    );

    toast({
      title: "Success",
      description: "Event updated successfully",
    });
  };

  const findEvent = (date: Date) => {
    const normalizedSearchDate = normalizeDate(date);
    return events.find(event => 
      normalizeDate(event.date).toDateString() === normalizedSearchDate.toDateString()
    );
  };

  return {
    events,
    addEvent,
    updateEvent,
    findEvent
  };
};