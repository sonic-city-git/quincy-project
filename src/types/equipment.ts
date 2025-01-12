export interface Equipment {
  id: string;
  name: string;
  code: string | null;
  folder_id: string | null;
  rental_price: number | null;
  weight: number | null;
  stock: number | null;
  internal_remark: string | null;
  created_at: string;
  updated_at: string;
  equipment_serial_numbers?: EquipmentSerialNumber[];
}

export interface EquipmentSerialNumber {
  id: string;
  equipment_id: string;
  serial_number: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectEquipment {
  id: string;
  equipment_id: string;
  name: string;
  code: string | null;
  quantity: number;
  rental_price: number | null;
  group_id: string | null;
}