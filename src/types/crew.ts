export interface CrewMember {
  id: string;
  name: string;
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
  roleIds: string[];
}

export interface CrewRole {
  id: string;
  name: string;
  color: string;
  created_at?: string;
}