export type Folder = {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
};

export type FolderInsert = Omit<Folder, 'id' | 'created_at' | 'updated_at'>;
export type FolderUpdate = Partial<FolderInsert>;