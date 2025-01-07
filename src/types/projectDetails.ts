export interface ProjectData {
  name: string;
  last_invoiced: string;
  owner: string;
  customer: string | null;
  color: string;
  gig_price: string | null;
  yearly_revenue: string | null;
}