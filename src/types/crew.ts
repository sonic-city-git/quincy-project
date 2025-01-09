export interface CrewMember {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role?: {
    id: string;
    name: string;
    color: string;
  } | null;
  created_at: string;
  updated_at: string;
  role_id: string | null;
}