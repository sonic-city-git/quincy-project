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
  folderId?: string;
  Folder?: string;  // Added to match database schema
  serialNumbers?: string[];
};