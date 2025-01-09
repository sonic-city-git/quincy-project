export interface CrewMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  folder_id: string;
  folder?: string; // Keep for backward compatibility during migration
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
  folder_id: string;
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

export interface CrewFolder {
  id: string;
  name: string;
  created_at: string;
}