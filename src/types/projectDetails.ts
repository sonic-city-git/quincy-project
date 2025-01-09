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
  customer_id: string | null;
  status: string;
}