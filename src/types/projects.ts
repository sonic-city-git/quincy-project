export interface Project {
  id: string;
  name: string;
  customer_id: string | null;
  owner: string;
  owner_id: string | null;
  color: string;
  lastInvoiced?: string | null;
  crew_member_id?: string | null;
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