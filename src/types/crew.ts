export interface CrewMember {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  folder_id: string | null;
  folderName?: string | null;
  roles?: string[];
  avatarUrl?: string;
}