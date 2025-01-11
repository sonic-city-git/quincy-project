export interface EventType {
  id: string;
  name: string;
  color: string;
  needs_crew?: boolean;
  rate_multiplier?: number;
}

export interface EventStatus {
  id: string;
  name: 'proposed' | 'confirmed' | 'invoice ready' | 'invoiced' | 'cancelled';
  description?: string;
}

export interface CalendarEvent {
  id: string;
  date: Date;
  name: string;
  type: EventType;
  status: EventStatus['name'];
  revenue?: number;
  location?: string;
}