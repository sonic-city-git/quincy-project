export type EquipmentFolder = {
  id: string;
  name: string;
  subfolders?: EquipmentFolder[];
};

export type SerialNumber = {
  number: string;
  status: "Available" | "In Use" | "Maintenance";
  notes?: string;
};

export type Equipment = {
  id: string;
  code: string;
  name: string;
  price: string;
  value: string;
  weight: string;
  stock: number;
  folder_id?: string;
  Folder?: string;
  serialNumbers?: SerialNumber[];
};