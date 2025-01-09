export interface CrewMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  folder_id: string;
  roles: CrewRole[];
  created_at: string;
}

export interface NewCrewMember {
  name: string;
  phone: string;
  email: string;
  folder_id: string;
  roles: CrewRole[];
}

export interface CrewRole {
  id: string;
  name: string;
  color: string;
  created_at?: string;
}

export interface CrewFolder {
  id: string;
  data: {
    name: string;
    created_at: string;
  };
  created_at: string;
}