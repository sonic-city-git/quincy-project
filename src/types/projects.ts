export interface Project {
  id: string;
  name: string;
  customer_id: string | null;
  owner_id: string | null;
  color: string;
  project_number: number;
  created_at: string;
  updated_at: string;
  to_be_invoiced: number | null;
  customer?: {
    id: string;
    name: string;
  } | null;
  owner?: {
    id: string;
    name: string;
    avatar_url?: string;
  } | null;
}

export interface ProjectData extends Project {
  customer?: {
    id: string;
    name: string;
  } | null;
  crew_member?: {
    id: string;
    name: string;
  } | null;
}