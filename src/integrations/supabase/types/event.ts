export type EventType = {
  id: string;
  name: string;
  color: string;
  needs_crew: boolean;
  needs_equipment: boolean;
  equipment_rate_multiplier: number;
  allows_discount: boolean;
  rate_type: string;
  rate_multiplier: number;
  crew_rate_multiplier: number;
  created_at: string;
  updated_at: string;
};

export type EventTypeInsert = Omit<EventType, 'id' | 'created_at' | 'updated_at'>;
export type EventTypeUpdate = Partial<EventTypeInsert>;

export type ProjectEvent = {
  id: string;
  project_id: string;
  date: string;
  name: string;
  event_type_id: string;
  revenue: number;
  status: string;
  location: string | null;
  equipment_price: number;
  total_price: number;
  created_at: string;
  updated_at: string;
};

export type ProjectEventInsert = Omit<ProjectEvent, 'id' | 'created_at' | 'updated_at'>;
export type ProjectEventUpdate = Partial<ProjectEventInsert>;