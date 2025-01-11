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
    status: event.event_statuses.name as CalendarEvent['status'],
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
  
  // Get the 'proposed' status id with proper error handling
  const { data: statusData, error: statusError } = await supabase
    .from('event_statuses')
    .select('id')
    .eq('name', 'proposed')
    .limit(1)
    .maybeSingle();

  if (!statusData) {
    console.error('Error: Proposed status not found in database');
    throw new Error('Required event status "proposed" not found in database');
  }

  if (statusError) {
    console.error('Error fetching proposed status:', statusError);
    throw statusError;
  }

  console.log('Adding event:', {
    projectId,
    date: formattedDate,
    eventName,
    eventType,
    statusId: statusData.id
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
      id: eventData.id,
      date: new Date(eventData.date),
      name: eventData.name,
      type: eventData.event_types,
      status: eventData.event_statuses.name as CalendarEvent['status'],
      revenue: eventData.revenue
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
  const { data: statusData, error: statusError } = await supabase
    .from('event_statuses')
    .select('id')
    .eq('name', updatedEvent.status)
    .limit(1)
    .maybeSingle();

  if (!statusData) {
    console.error('Error: Status not found in database:', updatedEvent.status);
    throw new Error(`Required event status "${updatedEvent.status}" not found in database`);
  }

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