import { supabase } from "@/integrations/supabase/client";
import { Project, ProjectData } from "@/types/projects";

export const projectBaseQuery = `
  *,
  customers (
    id,
    name
  ),
  owner:crew_members!projects_owner_id_fkey (
    id,
    name
  )
`;

export const transformProjectData = (project: any): Project => ({
  id: project.id,
  name: project.name,
  customer_id: project.customer_id,
  lastInvoiced: project.created_at || '',
  owner: project.owner?.name || project.customers?.name || 'No Owner',
  owner_id: project.owner_id,
  color: project.color || 'violet',
  crew_member_id: project.owner_id,
  project_number: project.project_number
});