export interface ProjectData {
  id: string;
  name: string;
  last_invoiced: string | null;
  owner_id: string;
  customer: string | null;
  color: string;
  gig_price: string | null;
  yearly_revenue: string | null;
  created_at: string;
  crew_members: {
    id: string;
    name: string;
  } | null;
}