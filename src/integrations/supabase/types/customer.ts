export type Customer = {
  id: string;
  name: string;
  customer_number: string | null;
  email: string | null;
  organization_number: string | null;
  phone_number: string | null;
  billing_address: string | null;
  shipping_address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CustomerInsert = {
  name: string;
  customer_number?: string | null;
  email?: string | null;
  organization_number?: string | null;
  phone_number?: string | null;
  billing_address?: string | null;
  shipping_address?: string | null;
  notes?: string | null;
};

export type CustomerUpdate = Partial<CustomerInsert>;