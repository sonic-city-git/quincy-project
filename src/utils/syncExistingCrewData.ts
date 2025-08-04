
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

    // For each event, sync crew roles and calculate costs
    for (const event of events) {
      console.log('Syncing crew for event:', event.id);
      
      // Sync crew roles and update cost from project requirements (customer-facing cost)
      const { error: crewSyncError } = await supabase.rpc('sync_event_crew', {
        p_event_id: event.id,
        p_project_id: projectId
      });

      if (crewSyncError) {
        console.error('Error syncing crew for event:', event.id, crewSyncError);
      } else {
        console.log('Successfully synced crew roles and cost for event:', event.id);
      }
    }

    console.log('Finished syncing existing crew data');
    return true;
  } catch (error) {
    console.error('Error in syncExistingCrewData:', error);
    throw error;
  }
};
