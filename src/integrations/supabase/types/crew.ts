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