import { supabase } from "@/integrations/supabase/client";
import { CalendarEvent, EventType } from "@/types/events";
import { formatDatabaseDate } from "./dateFormatters";

export const fetchEvents = async (projectId: string) => {
  console.log('Fetching events for project:', projectId);
  
  const { data, error } = await supabase
    .from('project_events')
    .select(`
      *,
      event_types (
        id,
        name,
        color,
        needs_crew,
        crew_rate_multiplier
      )
    `)
    .eq('project_id', projectId);

  if (error) {
    console.error('Error fetching events:', error);
    throw error;
  }

  console.log('Fetched events:', data);
  return (data || []).map(event => ({
    date: new Date(event.date),
    name: event.name,
    type: event.event_types
  }));
};

export const createEvent = async (
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
        crew_rate_multiplier
      )
    `)
    .single();

  if (eventError) {
    console.error('Error creating event:', eventError);
    throw eventError;
  }

  console.log('Created event:', eventData);
  return eventData;
};

export const updateEvent = async (
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