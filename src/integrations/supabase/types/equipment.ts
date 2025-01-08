export type Equipment = {
  "Book Value": number | null;
  Code: string | null;
  "External remark": string | null;
  Folder: string | null;
  folder_id: string | null;
  id: string;
  "Internal remark": string | null;
  Name: string | null;
  Price: number | null;
  Stock: number | null;
  "Stock calculation method": string | null;
  Weight: number | null;
};

export type EquipmentInsert = {
  "Book Value"?: number | null;
  Code?: string | null;
  "External remark"?: string | null;
  Folder?: string | null;
  folder_id?: string | null;
  id?: string;
  "Internal remark"?: string | null;
  Name?: string | null;
  Price?: number | null;
  Stock?: number | null;
  "Stock calculation method"?: string | null;
  Weight?: number | null;
};

export type EquipmentUpdate = {
  "Book Value"?: number | null;
  Code?: string | null;
  "External remark"?: string | null;
  Folder?: string | null;
  folder_id?: string | null;
  id?: string;
  "Internal remark"?: string | null;
  Name?: string | null;
  Price?: number | null;
  Stock?: number | null;
  "Stock calculation method"?: string | null;
  Weight?: number | null;
};

export type EquipmentSerialNumber = {
  id: string;
  equipment_id: string;
  serial_number: string;
  status: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};