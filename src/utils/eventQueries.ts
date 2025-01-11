import { supabase } from "@/integrations/supabase/client";
import { CalendarEvent, EventType } from "@/types/events";
import { formatDatabaseDate } from "./dateFormatters";
import { createRoleAssignments } from "./roleAssignments";

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

  console.log('Fetched events:', data);
  return (data || []).map(event => ({
    id: event.id,
    date: new Date(event.date),
    name: event.name,
    type: event.event_types,
    status: event.event_statuses.name,
    revenue: event.revenue
  }));
};

export const createEvent = async (
  projectId: string,
  date: Date,
  eventName: string,
  eventType: EventType
) => {
  const formattedDate = formatDatabaseDate(date);
  
  // First, get the 'proposed' status id
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
    status_id: statusData.id,
    needs_crew: eventType.needs_crew
  });

  try {
    const { data: eventData, error: eventError } = await supabase
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
          color,
          needs_crew,
          crew_rate_multiplier
        ),
        event_statuses (
          id,
          name
        )
      `)
      .single();

    if (eventError) {
      console.error('Error creating event:', eventError);
      throw eventError;
    }

    console.log('Created event:', eventData);

    if (eventType.needs_crew) {
      console.log('Event needs crew, creating role assignments');
      try {
        const roleAssignments = await createRoleAssignments(projectId, eventData.id);
        console.log('Created role assignments:', roleAssignments);
      } catch (roleError) {
        console.error('Error creating role assignments:', roleError);
      }
    }

    return {
      ...eventData,
      status: eventData.event_statuses.name
    };
  } catch (error) {
    console.error('Error in createEvent:', error);
    throw error;
  }
};

export const updateEvent = async (
  projectId: string,
  updatedEvent: CalendarEvent
) => {
  const formattedDate = formatDatabaseDate(updatedEvent.date);

  // Get the status id for the new status
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
    .eq('project_id', projectId)
    .eq('date', formattedDate);

  if (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};