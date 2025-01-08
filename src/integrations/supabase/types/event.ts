export type EventType = {
  id: string;
  name: string;
  color: string;
  created_at: string;
};

export type EventTypeInsert = {
  color: string;
  created_at?: string;
  id?: string;
  name: string;
};

export type EventTypeUpdate = {
  color?: string;
  created_at?: string;
  id?: string;
  name?: string;
};

export type ProjectEvent = {
  created_at: string;
  date: string;
  event_type_id: string;
  id: string;
  name: string;
  project_id: string;
};

export type ProjectEventInsert = {
  created_at?: string;
  date: string;
  event_type_id: string;
  id?: string;
  name: string;
  project_id: string;
};

export type ProjectEventUpdate = {
  created_at?: string;
  date?: string;
  event_type_id?: string;
  id?: string;
  name?: string;
  project_id?: string;
};