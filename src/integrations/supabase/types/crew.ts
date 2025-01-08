export type CrewMember = {
  created_at: string;
  email: string;
  folder: string;
  id: string;
  name: string;
  phone: string;
  role: string | null;
};

export type CrewMemberInsert = {
  created_at?: string;
  email: string;
  folder: string;
  id?: string;
  name: string;
  phone: string;
  role?: string | null;
};

export type CrewMemberUpdate = {
  created_at?: string;
  email?: string;
  folder?: string;
  id?: string;
  name?: string;
  phone?: string;
  role?: string | null;
};