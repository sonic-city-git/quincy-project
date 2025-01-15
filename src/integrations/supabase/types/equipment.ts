export type Equipment = {
  id: string;
  name: string;
  code: string | null;
  rental_price: number | null;
  stock: number | null;
  internal_remark: string | null;
  folder_id: string | null;
  created_at: string;
  updated_at: string;
  weight: number | null;
  stock_calculation: string | null;
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

export type EquipmentInsert = Omit<Equipment, 'id' | 'created_at' | 'updated_at'>;
export type EquipmentUpdate = Partial<EquipmentInsert>;