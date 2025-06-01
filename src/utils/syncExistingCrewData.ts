
import { supabase } from "@/integrations/supabase/client";

export const syncExistingCrewData = async (projectId: string) => {
  console.log('Syncing existing crew data for project:', projectId);
  
  try {
    // Get all project roles with their rates
    const { data: projectRoles, error: projectRolesError } = await supabase
      .from('project_roles')
      .select('*')
      .eq('project_id', projectId);

    if (projectRolesError) {
      console.error('Error fetching project roles:', projectRolesError);
      throw projectRolesError;
    }

    if (!projectRoles?.length) {
      console.log('No project roles found');
      return;
    }

    // Get all events for this project
    const { data: events, error: eventsError } = await supabase
      .from('project_events')
      .select('id')
      .eq('project_id', projectId);

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      throw eventsError;
    }

    if (!events?.length) {
      console.log('No events found');
      return;
    }

    // For each event, update the crew roles with proper rates
    for (const event of events) {
      console.log('Updating crew roles for event:', event.id);
      
      // Get existing event roles
      const { data: eventRoles, error: eventRolesError } = await supabase
        .from('project_event_roles')
        .select('*')
        .eq('event_id', event.id);

      if (eventRolesError) {
        console.error('Error fetching event roles:', eventRolesError);
        continue;
      }

      if (!eventRoles?.length) {
        console.log('No event roles found for event:', event.id);
        continue;
      }

      // Update each event role with the corresponding project role rates
      for (const eventRole of eventRoles) {
        const projectRole = projectRoles.find(pr => pr.role_id === eventRole.role_id);
        
        if (projectRole) {
          console.log('Updating event role:', eventRole.id, 'with rates from project role');
          
          const updateData = {
            daily_rate: projectRole.daily_rate,
            hourly_rate: projectRole.hourly_rate,
            hourly_category: projectRole.hourly_category || 'flat',
            crew_member_id: eventRole.crew_member_id || projectRole.preferred_id,
            // Set total_cost to daily_rate for immediate calculation
            total_cost: projectRole.daily_rate || null
          };

          const { error: updateError } = await supabase
            .from('project_event_roles')
            .update(updateData)
            .eq('id', eventRole.id);

          if (updateError) {
            console.error('Error updating event role:', updateError);
          } else {
            console.log('Successfully updated event role:', eventRole.id);
          }
        }
      }

      // Trigger price calculation update for each event after updating roles
      console.log('Triggering price calculation for event:', event.id);
      const { error: priceUpdateError } = await supabase.rpc('update_event_prices', {
        event_id: event.id
      });

      if (priceUpdateError) {
        console.error('Error updating event prices:', priceUpdateError);
        // Don't throw here as the sync was successful
      }
    }

    console.log('Finished syncing existing crew data');
    return true;
  } catch (error) {
    console.error('Error in syncExistingCrewData:', error);
    throw error;
  }
};
