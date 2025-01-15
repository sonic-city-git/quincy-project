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
    name,
    avatar_url
  )
`;

export const transformProjectData = (project: any): Project => ({
  id: project.id,
  name: project.name,
  customer_id: project.customer_id,
  owner_id: project.owner_id,
  color: project.color || 'violet',
  project_number: project.project_number,
  created_at: project.created_at,
  updated_at: project.updated_at,
  to_be_invoiced: project.to_be_invoiced,
  customer: project.customers,
  owner: project.owner
});