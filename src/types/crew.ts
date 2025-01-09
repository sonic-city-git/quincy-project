export interface CrewMember {
  id: string;
  name: string;
  role_id: string | null;
  email: string;
  phone: string;
  folder: string;
}

export interface NewCrewMember {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  folder: string;
  role_id?: string | null;
}

export interface CrewRole {
  id: string;
  name: string;
  color: string;
  created_at?: string;
}