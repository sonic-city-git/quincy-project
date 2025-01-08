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
  folder_id?: string;  // Using folder_id to match database schema
  Folder?: string;     // Keeping Folder as it exists in the database
  serialNumbers?: string[]; // Adding serialNumbers support
};