export type CrewMember = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  folder_id: string | null;
  created_at: string;
  updated_at: string;
  auth_id: string | null;
  avatar_url: string | null;
};

export type CrewMemberInsert = Omit<CrewMember, 'id' | 'created_at' | 'updated_at'>;
export type CrewMemberUpdate = Partial<CrewMemberInsert>;

export type HourlyCategory = 'flat' | 'corporate' | 'broadcast';

export type ProjectRole = {
  id: string;
  project_id: string | null;
  role_id: string | null;
  daily_rate: number | null;
  hourly_rate: number | null;
  hourly_category: HourlyCategory;
  preferred_id: string | null;
  created_at: string;
  updated_at: string;
};