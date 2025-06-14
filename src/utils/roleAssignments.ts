
import { supabase } from "@/integrations/supabase/client";

export const createRoleAssignments = async (projectId: string, eventId: string) => {
  console.log('Creating role assignments for:', { projectId, eventId });

  try {
    // First, fetch all project roles with their associated crew roles and rates
    const { data: projectRoles, error: rolesError } = await supabase
      .from('project_roles')
      .select(`
        id,
        role_id,
        daily_rate,
        hourly_rate,
        preferred_id,
        hourly_category,
        crew_roles (
          id,
          name,
          color
        )
      `)
      .eq('project_id', projectId);

    if (rolesError) {
      console.error('Error fetching project roles:', rolesError);
      throw rolesError;
    }

    console.log('Found project roles:', projectRoles);

    if (!projectRoles?.length) {
      console.log('No project roles found to create assignments for');
      return [];
    }

    // Check if event roles already exist to avoid duplicates
    const { data: existingRoles } = await supabase
      .from('project_event_roles')
      .select('role_id')
      .eq('event_id', eventId);

    const existingRoleIds = new Set(existingRoles?.map(r => r.role_id) || []);

    // Filter out roles that already exist for this event
    const rolesToCreate = projectRoles.filter(role => !existingRoleIds.has(role.role_id));

    if (rolesToCreate.length === 0) {
      console.log('All roles already exist for this event');
      return [];
    }

    // Create event role assignments for each new project role with proper rate copying
    const roleAssignments = rolesToCreate.map(role => ({
      project_id: projectId,
      event_id: eventId,
      role_id: role.role_id,
      crew_member_id: role.preferred_id,
      daily_rate: role.daily_rate,
      hourly_rate: role.hourly_rate,
      hourly_category: role.hourly_category || 'flat',
      hours_worked: null,
      // Set total_cost to daily_rate for immediate calculation
      total_cost: role.daily_rate || 0
    }));

    console.log('Creating role assignments with rates:', roleAssignments);

    const { data: insertedRoles, error: insertError } = await supabase
      .from('project_event_roles')
      .insert(roleAssignments)
      .select(`
        *,
        crew_roles (
          id,
          name,
          color
        ),
        crew_members (
          id,
          name
        )
      `);

    if (insertError) {
      console.error('Error creating role assignments:', insertError);
      throw insertError;
    }

    console.log('Successfully created role assignments:', insertedRoles);

    // Wait a moment for database triggers to process
    await new Promise(resolve => setTimeout(resolve, 200));

    console.log('Role assignments created, database triggers will update event prices automatically');

    return insertedRoles;
  } catch (error) {
    console.error('Error in createRoleAssignments:', error);
    throw error;
  }
};
