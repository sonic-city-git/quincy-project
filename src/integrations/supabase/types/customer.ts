export type Customer = {
  created_at: string;
  customer_number: string | null;
  email: string | null;
  id: string;
  name: string;
  organization_number: string | null;
  phone_number: string | null;
  tripletex_id: number;
  updated_at: string;
};

export type CustomerInsert = {
  created_at?: string;
  customer_number?: string | null;
  email?: string | null;
  id?: string;
  name: string;
  organization_number?: string | null;
  phone_number?: string | null;
  tripletex_id: number;
  updated_at?: string;
};

export type CustomerUpdate = {
  created_at?: string;
  customer_number?: string | null;
  email?: string | null;
  id?: string;
  name?: string;
  organization_number?: string | null;
  phone_number?: string | null;
  tripletex_id?: number;
  updated_at?: string;
};