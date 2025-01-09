export interface Project {
  id: string;
  name: string;
  customer_id: string | null;
  owner_id: string;
  color: string;
  status: string | null;
  metadata: Record<string, any>;
  created_at: string;
  last_invoiced?: string | null;
  gig_price?: string | null;
  yearly_revenue?: string | null;
  crew_members?: {
    id: string;
    name: string;
  }[];
}

export interface ProjectData extends Project {
  owner: {
    id: string;
    name: string;
  };
  customer: {
    id: string;
    name: string;
  } | null;
}