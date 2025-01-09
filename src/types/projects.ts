export interface Project {
  id: string;
  name: string;
  customer_id: string | null;
  owner: string;
  owner_id: string | null;
  color: string;
  status: string;
  lastInvoiced?: string | null;
  gigPrice?: string | null;
  yearlyRevenue?: string | null;
}

export interface ProjectData extends Project {
  customer?: {
    id: string;
    name: string;
  } | null;
}