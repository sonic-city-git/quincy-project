export type Folder = {
  created_at: string;
  id: string;
  name: string;
  parent_id: string | null;
};

export type FolderInsert = {
  created_at?: string;
  id?: string;
  name: string;
  parent_id?: string | null;
};

export type FolderUpdate = {
  created_at?: string;
  id?: string;
  name?: string;
  parent_id?: string | null;
};