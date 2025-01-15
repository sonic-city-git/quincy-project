export type Project = {
  id: string;
  name: string;
  project_number: number;
  customer_id: string | null;
  owner_id: string | null;
  color: string;
  to_be_invoiced: number;
  created_at: string;
  updated_at: string;
};

export type ProjectInsert = Omit<Project, 'id' | 'created_at' | 'updated_at'>;
export type ProjectUpdate = Partial<ProjectInsert>;