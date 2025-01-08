export type EquipmentFolder = {
  id: string;
  name: string;
  subfolders?: EquipmentFolder[];
};

export type Equipment = {
  id: string;
  code: string;
  name: string;
  price: string;
  value: string;
  weight: string;
  stock: number;
  folder_id?: string;  // Changed from folderId to match database schema
  Folder?: string;
};