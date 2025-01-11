export interface ProjectEquipment {
  id: string;
  equipment_id: string;
  name: string;
  code: string | null;
  quantity: number;
  rental_price: number | null;
  group_id: string | null;
  group_name?: string;
}