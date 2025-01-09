export interface CrewMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  folder_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  roles?: CrewRole[];
}

export interface NewCrewMember {
  name: string;
  phone: string;
  email: string;
  folder_id: string | null;
  roles: CrewRole[];
}

export interface CrewRole {
  id: string;
  name: string;
  color: string;
  sort_order?: number;
  created_at?: string;
}

export interface CrewFolder {
  id: string;
  name: string;
  type: string;
  parent_id: string | null;
  created_at: string;
}