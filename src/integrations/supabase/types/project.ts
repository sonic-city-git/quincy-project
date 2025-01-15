export type Project = {
  id: string;
  name: string;
  last_invoiced: string | null;
  owner_id: string;
  customer: string | null;
  color: string;
  gig_price: string | null;
  yearly_revenue: string | null;
  created_at: string;
};

export type ProjectInsert = {
  color: string;
  created_at?: string;
  customer?: string | null;
  gig_price?: string | null;
  id?: string;
  last_invoiced?: string | null;
  name: string;
  owner_id: string;
  yearly_revenue?: string | null;
};

export type ProjectUpdate = {
  color?: string;
  created_at?: string;
  customer?: string | null;
  gig_price?: string | null;
  id?: string;
  last_invoiced?: string | null;
  name?: string;
  owner_id?: string;
  yearly_revenue?: string | null;
};