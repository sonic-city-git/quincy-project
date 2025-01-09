import { supabase } from "@/integrations/supabase/client";

export const createRoleAssignments = async (projectId: string, eventId: string) => {
  console.log('Creating role assignments for:', { projectId, eventId });

  try {
    // First, fetch all project roles with their associated crew roles
    const { data: projectRoles, error: rolesError } = await supabase
      .from('project_roles')
      .select(`
        id,
        role_id,
        daily_rate,
        hourly_rate,
        preferred_id,
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

    // Create event role assignments for each project role
    const roleAssignments = projectRoles.map(role => ({
      project_id: projectId,
      event_id: eventId,
      role_id: role.role_id,
      crew_member_id: role.preferred_id || null,
      daily_rate: role.daily_rate,
      hourly_rate: role.hourly_rate
    }));

    console.log('Creating role assignments:', roleAssignments);

    const { data: insertedRoles, error: insertError } = await supabase
      .from('project_event_roles')
      .insert(roleAssignments)
      .select('*, crew_roles (id, name, color), crew_members (id, name)');

    if (insertError) {
      console.error('Error creating role assignments:', insertError);
      throw insertError;
    }

    console.log('Successfully created role assignments:', insertedRoles);
    return insertedRoles;
  } catch (error) {
    console.error('Error in createRoleAssignments:', error);
    throw error;
  }
};