import { supabase } from "@/integrations/supabase/client";

export const createRoleAssignments = async (projectId: string, eventId: string) => {
  console.log('Event needs crew, fetching project roles...');
  
  // First, get all project roles
  const { data: projectRoles, error: rolesError } = await supabase
    .from('project_roles')
    .select(`
      *,
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
    return;
  }

  // Create role assignments for each project role
  const roleAssignments = projectRoles.map(role => ({
    project_id: projectId,
    event_id: eventId,
    role_id: role.role_id,
    daily_rate: role.daily_rate,
    hourly_rate: role.hourly_rate,
    crew_member_id: role.preferred_id // Include preferred crew member if set
  }));

  console.log('Creating role assignments:', roleAssignments);

  const { error: assignError } = await supabase
    .from('project_event_roles')
    .insert(roleAssignments);

  if (assignError) {
    console.error('Error creating role assignments:', assignError);
    throw assignError;
  }

  console.log('Successfully created role assignments');
};