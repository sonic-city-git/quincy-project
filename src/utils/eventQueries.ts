
import { supabase } from "@/integrations/supabase/client";
import { CalendarEvent, EventType } from "@/types/events";
import { formatDatabaseDate } from "./dateFormatters";
import { createRoleAssignments } from "./roleAssignments";

export const fetchEvents = async (projectId: string) => {
  console.log('Fetching events for project:', projectId);
  
  // First, try to fetch events with proper variant join using foreign key
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
      ),
      project_variants!project_events_variant_id_fkey (
        id,
        variant_name
      )
    `)
    .eq('project_id', projectId);

  if (error) {
    console.error('Error fetching events with variants:', error);
    
    // Fallback: fetch events without variant join if foreign key doesn't exist
    console.log('Trying fallback query without variant join...');
    const { data: fallbackData, error: fallbackError } = await supabase
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

    if (fallbackError) {
      console.error('Fallback query also failed:', fallbackError);
      throw fallbackError;
    }

    // Manual variant lookup for fallback
    const eventsWithVariants = await Promise.all(
      (fallbackData || []).map(async (event) => {
        let variantData = null;
        
        if (event.variant_id) {
          const { data: variant } = await supabase
            .from('project_variants')
            .select('id, variant_name')
            .eq('id', event.variant_id)
            .single();
          variantData = variant;
        }

        return {
          ...event,
          project_variants: variantData
        };
      })
    );

    return eventsWithVariants.map(event => ({
      id: event.id,
      project_id: event.project_id,
      date: new Date(event.date),
      name: event.name,
      type: event.event_types,
      status: event.status as CalendarEvent['status'],
      location: event.location || '',
      location_data: event.location_data || null, // Handle missing column gracefully
      variant_id: event.variant_id,
      variant_name: event.project_variants?.variant_name || 'default',
      equipment_price: event.equipment_price,
      crew_price: event.crew_price,
      total_price: event.total_price
    }));
  }

  console.log('Fetched events with variants:', data);
  return (data || []).map(event => ({
    id: event.id,
    project_id: event.project_id,
    date: new Date(event.date),
    name: event.name,
    type: event.event_types,
    status: event.status as CalendarEvent['status'],
    location: event.location || '',
    location_data: event.location_data || null, // Handle missing column gracefully
    variant_id: event.variant_id,
    variant_name: event.project_variants?.variant_name || 'default',
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
  status: CalendarEvent['status'] = 'proposed',
  variantName: string = 'default',
  location: string = '',
  locationData?: any
) => {
  const formattedDate = formatDatabaseDate(date);
  
  console.log('🚀 Creating event with variant system...');
  console.log('Adding event - projectId:', projectId);
  console.log('Adding event - date:', formattedDate);
  console.log('Adding event - eventName:', eventName);
  console.log('Adding event - eventType:', eventType.name);
  console.log('Adding event - status:', status);
  console.log('Adding event - variantName:', variantName);
  console.log('Adding event - location:', location);
  console.log('Adding event - locationData:', locationData);

  try {
    // First, get the variant ID from the variant name
    const { data: variant, error: variantError } = await supabase
      .from('project_variants')
      .select('id')
      .eq('project_id', projectId)
      .eq('variant_name', variantName)
      .maybeSingle();

    if (variantError) {
      console.error('Error fetching variant:', variantError);
      throw new Error(`Failed to find variant "${variantName}": ${variantError.message}`);
    }

    if (!variant) {
      throw new Error(`Variant "${variantName}" not found for project ${projectId}`);
    }

    console.log('Found variant ID:', variant.id);

    // Create event with variant_id, location, and optionally structured location data
    const insertData: any = {
      project_id: projectId,
      date: formattedDate,
      name: eventName.trim() || eventType.name,
      event_type_id: eventType.id,
      variant_id: variant.id,
      status: status,
      location: location,
      equipment_price: 0,
      crew_price: 0,
      total_price: 0
    };

    // Add structured location data if provided AND column exists
    // (This will be enabled after migration is applied)
    if (locationData) { // Temporarily disabled until migration
      insertData.location_data = locationData;
      console.log('📍 Storing structured location data:', locationData);
    } else if (locationData) {
      console.log('📍 Structured location data available but column not migrated yet:', locationData);
    }

    const { data: eventData, error: eventError } = await supabase
      .from('project_events')
      .insert(insertData)
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
      console.error('❌ Database error creating event:');
      console.error('Error code:', eventError.code);
      console.error('Error message:', eventError.message);
      console.error('Error details:', eventError.details);
      console.error('Error hint:', eventError.hint);
      console.error('Full error object:', eventError);
      console.error('Sent variantName:', variantName);
      throw eventError;
    }

    console.log('Created event:', eventData);

    if (eventType.needs_equipment) {
      // Use variant-aware unified sync function for consistent behavior and pricing
      // Note: Database functions still use variant_name parameter until migration is applied
      const { error: equipmentError } = await supabase.rpc('sync_event_equipment_unified', {
        p_event_id: eventData.id,
        p_project_id: projectId,
        p_variant_id: variant.id
      });

      if (equipmentError) {
        console.error('Error syncing equipment for variant:', variantName, equipmentError);
      }
    }

    // Only sync crew if the event type needs crew (includes role creation + cost calculation)
    if (eventType.needs_crew) {
      console.log('Event needs crew, syncing crew roles and calculating cost for variant:', variantName);
      // Note: Database functions still use variant_name parameter until migration is applied
      const { error: crewError } = await supabase.rpc('sync_event_crew', {
        p_event_id: eventData.id,
        p_project_id: projectId,
        p_variant_id: variant.id
      });

      if (crewError) {
        console.error('Error syncing crew for variant:', variantName, crewError);
      }
    }

    // Wait for database triggers to complete price calculations
    await new Promise(resolve => setTimeout(resolve, 300));

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
        variant_name: eventData.variant_name || 'default',
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
      variant_name: updatedEvent.variant_name || 'default',
      equipment_price: updatedEvent.equipment_price,
      crew_price: updatedEvent.crew_price,
      total_price: updatedEvent.total_price
    };
  } catch (error) {
    console.error('❌ Catch block error in createEvent:');
    console.error('Error message:', error?.message);
    console.error('Error code:', error?.code);
    console.error('variantName sent:', variantName);
    console.error('eventType:', eventType.name);
    console.error('projectId:', projectId);
    console.error('Full error:', error);
    throw error;
  }
};

export const updateEvent = async (
  projectId: string,
  updatedEvent: CalendarEvent
) => {
  console.log('🔄 Updating event with full data...');
  console.log('Event ID:', updatedEvent.id);
  console.log('Updated location:', updatedEvent.location);
  console.log('Updated variant_name:', updatedEvent.variant_name);

  try {
    // Get variant_id from variant_name if variant changed
    let variantId = updatedEvent.variant_id;
    
    if (updatedEvent.variant_name && !variantId) {
      const { data: variant, error: variantError } = await supabase
        .from('project_variants')
        .select('id')
        .eq('project_id', projectId)
        .eq('variant_name', updatedEvent.variant_name)
        .maybeSingle();

      if (variantError) {
        console.error('Error fetching variant for update:', variantError);
        throw new Error(`Failed to find variant "${updatedEvent.variant_name}": ${variantError.message}`);
      }

      if (!variant) {
        throw new Error(`Variant "${updatedEvent.variant_name}" not found for project ${projectId}`);
      }

      variantId = variant.id;
    }

    // First delete any sync operations for this event
    const { error: syncDeleteError } = await supabase
      .from('sync_operations')
      .delete()
      .match({ event_id: updatedEvent.id });

    if (syncDeleteError) {
      console.error('Error deleting sync operations:', syncDeleteError);
      throw syncDeleteError;
    }

    // Update the event with all fields including location, location_data, and variant_id
    const updateData: any = {
      name: updatedEvent.name.trim() || updatedEvent.type.name,
      event_type_id: updatedEvent.type.id,
      status: updatedEvent.status,
      location: updatedEvent.location || ''
    };

    // Only update variant_id if we have one
    if (variantId) {
      updateData.variant_id = variantId;
    }

    // Update structured location data if provided AND column exists
    // (This will be enabled after migration is applied)
    if (updatedEvent.location_data !== undefined) { // Temporarily disabled until migration
      updateData.location_data = updatedEvent.location_data;
      console.log('📍 Updating structured location data:', updatedEvent.location_data);
    } else if (updatedEvent.location_data !== undefined) {
      console.log('📍 Structured location data update available but column not migrated yet:', updatedEvent.location_data);
    }

    const { error } = await supabase
      .from('project_events')
      .update(updateData)
      .eq('id', updatedEvent.id)
      .eq('project_id', projectId);

    if (error) {
      console.error('Error updating event:', error);
      throw error;
    }

    console.log('✅ Event updated successfully');
  } catch (error) {
    console.error('❌ Error in updateEvent:', error);
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
