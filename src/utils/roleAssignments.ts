import { supabase } from "@/integrations/supabase/client";

export const createRoleAssignments = async (projectId: string, eventId: string) => {
  console.log('Creating role assignments for:', { projectId, eventId });

  // First, fetch all project roles
  const { data: projectRoles, error: rolesError } = await supabase
    .from('project_roles')
    .select(`
      *,
      role_id,
      preferred_id,
      daily_rate,
      hourly_rate
    `)
    .eq('project_id', projectId);

  if (rolesError) {
    console.error('Error fetching project roles:', rolesError);
    throw rolesError;
  }

  console.log('Found project roles:', projectRoles);

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

  const { error: insertError } = await supabase
    .from('project_event_roles')
    .insert(roleAssignments);

  if (insertError) {
    console.error('Error creating role assignments:', insertError);
    throw insertError;
  }

  console.log('Successfully created role assignments');
};