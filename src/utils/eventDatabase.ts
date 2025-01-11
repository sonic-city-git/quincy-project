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
      ),
      event_statuses (
        id,
        name
      )
    `)
    .eq('project_id', projectId);

  if (error) {
    console.error('Error fetching events:', error);
    throw error;
  }

  return data?.map(event => ({
    id: event.id,
    date: new Date(event.date),
    name: event.name,
    type: event.event_types,
    status: event.event_statuses.name as CalendarEvent['status'],
    revenue: event.revenue
  })) || [];
};

export const insertEvent = async (
  projectId: string,
  date: Date,
  eventName: string,
  eventType: EventType
) => {
  const formattedDate = formatDatabaseDate(date);
  
  // Get the 'proposed' status id
  const { data: statusData, error: statusError } = await supabase
    .from('event_statuses')
    .select('id')
    .eq('name', 'proposed')
    .single();

  if (statusError) {
    console.error('Error fetching proposed status:', statusError);
    throw statusError;
  }
  
  console.log('Adding event:', {
    project_id: projectId,
    date: formattedDate,
    name: eventName,
    event_type_id: eventType.id,
    status_id: statusData.id
  });

  const { data, error } = await supabase
    .from('project_events')
    .insert({
      project_id: projectId,
      date: formattedDate,
      name: eventName.trim() || eventType.name,
      event_type_id: eventType.id,
      status_id: statusData.id
    })
    .select(`
      *,
      event_types (
        id,
        name,
        color
      ),
      event_statuses (
        id,
        name
      )
    `)
    .single();

  if (error) {
    console.error('Error adding event:', error);
    throw error;
  }

  console.log('Event added successfully:', data);
  return {
    id: data.id,
    date: new Date(data.date),
    name: data.name,
    type: data.event_types,
    status: data.event_statuses.name as CalendarEvent['status'],
    revenue: data.revenue
  };
};

export const updateEventInDb = async (
  projectId: string,
  updatedEvent: CalendarEvent
) => {
  const formattedDate = formatDatabaseDate(updatedEvent.date);

  // Get the status id for the status
  const { data: statusData, error: statusError } = await supabase
    .from('event_statuses')
    .select('id')
    .eq('name', updatedEvent.status)
    .single();

  if (statusError) {
    console.error('Error fetching status:', statusError);
    throw statusError;
  }

  const { error } = await supabase
    .from('project_events')
    .update({
      name: updatedEvent.name.trim() || updatedEvent.type.name,
      event_type_id: updatedEvent.type.id,
      status_id: statusData.id
    })
    .eq('id', updatedEvent.id)
    .eq('project_id', projectId);

  if (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};