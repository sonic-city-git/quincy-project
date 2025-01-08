import { useState, useEffect } from "react";
import { CalendarEvent, EventType } from "@/types/events";
import { useToast } from "@/hooks/use-toast";
import { formatDatabaseDate } from "@/utils/dateFormatters";
import { fetchProjectEvents, insertEvent, updateEventInDb } from "@/utils/eventDatabase";

export const useCalendarEvents = (projectId: string | undefined) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const loadEvents = async () => {
      if (!projectId) return;

      try {
        const fetchedEvents = await fetchProjectEvents(projectId);
        setEvents(fetchedEvents);
      } catch (error) {
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
      throw new Error('Project ID is missing');
    }

    try {
      const newEventData = await insertEvent(projectId, date, eventName, eventType);
      
      const newEvent: CalendarEvent = {
        date: new Date(newEventData.date),
        name: newEventData.name,
        type: newEventData.type as EventType
      };

      setEvents(prev => [...prev, newEvent]);
      
      toast({
        title: "Success",
        description: "Event added successfully",
      });

      return newEvent;
    } catch (error) {
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
      await updateEventInDb(projectId, updatedEvent);

      setEvents(prev => 
        prev.map(event => 
          formatDatabaseDate(event.date) === formatDatabaseDate(updatedEvent.date)
            ? { ...updatedEvent, name: updatedEvent.name.trim() || updatedEvent.type }
            : event
        )
      );

      toast({
        title: "Success",
        description: "Event updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive",
      });
      throw error;
    }
  };

  const findEvent = (date: Date) => {
    const searchDate = formatDatabaseDate(date);
    return events.find(event => 
      formatDatabaseDate(event.date) === searchDate
    );
  };

  return {
    events,
    addEvent,
    updateEvent,
    findEvent
  };
};