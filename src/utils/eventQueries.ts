
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
        needs_equipment,
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
    id: event.id,
    project_id: event.project_id,
    date: new Date(event.date),
    name: event.name,
    type: event.event_types,
    status: event.status as CalendarEvent['status'],
    location: event.location,
    equipment_price: event.equipment_price,
    crew_price: event.crew_price,
    total_price: event.total_price
  }));
};

export const createEvent = async (
  projectId: string,
  date: Date,
  eventName: string,
  eventType: EventType,
  status: CalendarEvent['status'] = 'proposed'
) => {
  const formattedDate = formatDatabaseDate(date);
  
  console.log('Adding event:', {
    projectId,
    date: formattedDate,
    eventName,
    eventType,
    status
  });

  try {
    const { data: eventData, error: eventError } = await supabase
      .from('project_events')
      .insert({
        project_id: projectId,
        date: formattedDate,
        name: eventName.trim() || eventType.name,
        event_type_id: eventType.id,
        status: status,
        equipment_price: 0,
        crew_price: 0,
        total_price: 0
      })
      .select(`
        *,
        event_types (
          id,
          name,
          color,
          needs_crew,
          needs_equipment,
          crew_rate_multiplier
        )
      `)
      .single();

    if (eventError) {
      console.error('Error creating event:', eventError);
      throw eventError;
    }

    console.log('Created event:', eventData);

    if (eventType.needs_equipment) {
      // Use unified sync function for consistent behavior and pricing
      const { error: equipmentError } = await supabase.rpc('sync_event_equipment_unified', {
        p_event_id: eventData.id,
        p_project_id: projectId
      });

      if (equipmentError) {
        console.error('Error syncing equipment:', equipmentError);
      }
    }

    // Only create role assignments if the event type needs crew
    if (eventType.needs_crew) {
      console.log('Event needs crew, creating role assignments');
      try {
        const roleAssignments = await createRoleAssignments(projectId, eventData.id);
        console.log('Created role assignments:', roleAssignments);
      } catch (roleError) {
        console.error('Error creating role assignments:', roleError);
      }
    }

    // Wait longer for database triggers to complete price calculations
    await new Promise(resolve => setTimeout(resolve, 500));

    // Fetch the updated event with calculated prices
    const { data: updatedEvent, error: fetchError } = await supabase
      .from('project_events')
      .select(`
        *,
        event_types (
          id,
          name,
          color,
          needs_crew,
          needs_equipment,
          crew_rate_multiplier
        )
      `)
      .eq('id', eventData.id)
      .single();

    if (fetchError) {
      console.error('Error fetching updated event:', fetchError);
      // Return the original event data if we can't fetch the updated version
      return {
        id: eventData.id,
        project_id: eventData.project_id,
        date: new Date(eventData.date),
        name: eventData.name,
        type: eventData.event_types,
        status: eventData.status as CalendarEvent['status'],
        equipment_price: eventData.equipment_price,
        crew_price: eventData.crew_price,
        total_price: eventData.total_price
      };
    }

    console.log('Returning updated event with calculated prices:', updatedEvent);

    return {
      id: updatedEvent.id,
      project_id: updatedEvent.project_id,
      date: new Date(updatedEvent.date),
      name: updatedEvent.name,
      type: updatedEvent.event_types,
      status: updatedEvent.status as CalendarEvent['status'],
      equipment_price: updatedEvent.equipment_price,
      crew_price: updatedEvent.crew_price,
      total_price: updatedEvent.total_price
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
  // First delete any sync operations for this event
  const { error: syncDeleteError } = await supabase
    .from('sync_operations')
    .delete()
    .match({ event_id: updatedEvent.id });

  if (syncDeleteError) {
    console.error('Error deleting sync operations:', syncDeleteError);
    throw syncDeleteError;
  }

  const { error } = await supabase
    .from('project_events')
    .update({
      name: updatedEvent.name.trim() || updatedEvent.type.name,
      event_type_id: updatedEvent.type.id,
      status: updatedEvent.status
    })
    .eq('id', updatedEvent.id)
    .eq('project_id', projectId);

  if (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

export const deleteEvent = async (eventId: string, projectId: string) => {
  try {
    console.log('Starting deletion process for event:', eventId);
    
    // First delete sync operations
    const { error: syncDeleteError } = await supabase
      .from('sync_operations')
      .delete()
      .match({ event_id: eventId });
      
    if (syncDeleteError) {
      console.error('Error deleting sync operations:', syncDeleteError);
      throw new Error(`Failed to delete sync operations: ${syncDeleteError.message}`);
    }

    // Delete equipment records
    const { error: equipmentError } = await supabase
      .from('project_event_equipment')
      .delete()
      .match({ event_id: eventId });
      
    if (equipmentError) {
      console.error('Error deleting event equipment:', equipmentError);
      throw new Error(`Failed to delete equipment: ${equipmentError.message}`);
    }

    // Delete role records
    const { error: rolesError } = await supabase
      .from('project_event_roles')
      .delete()
      .match({ event_id: eventId });
      
    if (rolesError) {
      console.error('Error deleting event roles:', rolesError);
      throw new Error(`Failed to delete roles: ${rolesError.message}`);
    }

    // Delete the event
    const { error: eventError } = await supabase
      .from('project_events')
      .delete()
      .match({ id: eventId, project_id: projectId });
      
    if (eventError) {
      console.error('Error deleting event:', eventError);
      throw new Error(`Failed to delete event: ${eventError.message}`);
    }

    console.log('Successfully deleted event and related records');
    return true;
  } catch (error) {
    console.error('Error in deleteEvent:', error);
    throw error;
  }
};

export const updateEventRole = async (roleId: string, data: any) => {
  const { error } = await supabase
    .from('project_event_roles')
    .update(data)
    .eq('id', roleId);

  if (error) {
    console.error('Error updating event role:', error);
    throw error;
  }
};
