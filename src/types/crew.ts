export interface CrewMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  folder_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  roles?: CrewRole[];
  crew_folder?: {
    id: string;
    name: string;
    created_at: string;
  };
}

export interface NewCrewMember {
  name: string;
  phone: string;
  email: string;
  folder_id: string | null;
  roles: CrewRole[];
  crew_folder?: {
    id: string;
    name: string;
    created_at: string;
  };
}

export interface CrewRole {
  id: string;
  name: string;
  color: string;
  created_at: string;
}