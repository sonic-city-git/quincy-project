import { supabase } from "@/integrations/supabase/client";
import { CalendarEvent, EventType } from "@/types/events";
import { formatDatabaseDate } from "./dateFormatters";

export const fetchProjectEvents = async (projectId: string) => {
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

  if (error) {
    console.error('Error fetching events:', error);
    throw error;
  }

  return data?.map(event => ({
    date: new Date(event.date),
    name: event.name,
    type: event.event_types as EventType
  })) || [];
};

export const insertEvent = async (
  projectId: string,
  date: Date,
  eventName: string,
  eventType: EventType
) => {
  const formattedDate = formatDatabaseDate(date);
  
  console.log('Adding event:', {
    project_id: projectId,
    date: formattedDate,
    name: eventName,
    event_type_id: eventType.id
  });

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
    console.error('Error adding event:', error);
    throw error;
  }

  console.log('Event added successfully:', data);
  return data;
};

export const updateEventInDb = async (
  projectId: string,
  updatedEvent: CalendarEvent
) => {
  const formattedDate = formatDatabaseDate(updatedEvent.date);

  const { error } = await supabase
    .from('project_events')
    .update({
      name: updatedEvent.name.trim() || updatedEvent.type.name,
      event_type_id: updatedEvent.type.id
    })
    .eq('project_id', projectId)
    .eq('date', formattedDate);

  if (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};