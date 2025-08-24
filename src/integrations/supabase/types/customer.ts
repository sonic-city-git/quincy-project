export type Customer = {
  id: string;
  name: string;
  customer_number: string | null;
  organization_number: string | null;
  email: string | null;
  phone_number: string | null;
  created_at: string;
  updated_at: string;
  fiken_customer_id: string | null;
};

export type CustomerInsert = Omit<Customer, 'id' | 'created_at' | 'updated_at'>;
export type CustomerUpdate = Partial<CustomerInsert>;