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

export const transformProjectData = (project: any) => ({
  id: project.id,
  name: project.name,
  customer_id: project.customer_id,
  owner_id: project.owner_id,
  color: project.color || 'violet',
  project_number: project.project_number,
  created_at: project.created_at,
  updated_at: project.updated_at,
  to_be_invoiced: project.to_be_invoiced,
  is_archived: project.is_archived || false,
  project_type: project.project_type || 'artist',
  customer: project.customers,
  owner: project.owner
});