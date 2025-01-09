export interface Folder {
  id: string;
  name: string;
  type: 'crew' | 'equipment';
  parent_id: string | null;
  created_at: string;
}