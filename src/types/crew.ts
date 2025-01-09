export interface CrewMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  folder: string;
  crew_member_roles?: Array<{
    role_id: string;
    crew_roles?: CrewRole;
  }>;
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

export interface CrewMemberRole {
  id: string;
  crew_member_id: string;
  role_id: string;
  created_at: string;
}