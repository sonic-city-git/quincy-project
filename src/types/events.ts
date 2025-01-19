export interface EventType {
  id: string;
  name: string;
  color: string;
  needs_crew?: boolean;
  needs_equipment?: boolean;
  rate_multiplier?: number;
}

export interface EventStatus {
  id: string;
  name: 'proposed' | 'confirmed' | 'invoice ready' | 'invoiced' | 'cancelled';
  description?: string;
}

export type HourlyCategory = 'flat' | 'corporate' | 'broadcast';

export interface CalendarEvent {
  id: string;
  date: Date;
  name: string;
  type: EventType;
  status: EventStatus['name'];
  location?: string;
  equipment?: Array<{ id: string; name: string }>;
  project_id: string;
  equipment_price?: number;
  crew_price?: number;
  total_price?: number;
  project_event_roles?: Array<{
    id: string;
    crew_member_id: string | null;
    role_id: string;
  }>;
}