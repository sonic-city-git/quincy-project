export type Equipment = {
  id: string;
  name: string | null;
  code: string | null;
  rental_price: number | null;
  stock: number | null;
  internal_remark: string | null;
  folder: string | null;
  created_at: string;
  updated_at: string;
  weight: number | null;
  stock_calculation: string | null;
  equipment_serial_numbers?: EquipmentSerialNumber[];
};

export type EquipmentSerialNumber = {
  id: string;
  equipment_id: string;
  serial_number: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type EquipmentInsert = {
  name: string;
  code?: string | null;
  rental_price?: number | null;
  stock?: number | null;
  internal_remark?: string | null;
  folder?: string | null;
  weight?: number | null;
  stock_calculation?: string | null;
};

export type EquipmentUpdate = {
  name?: string;
  code?: string | null;
  rental_price?: number | null;
  stock?: number | null;
  internal_remark?: string | null;
  folder?: string | null;
  weight?: number | null;
  stock_calculation?: string | null;
};