export interface EventType {
  id: string;
  name: string;
  color: string;
  needs_crew?: boolean;
  rate_multiplier?: number;
}

export interface CalendarEvent {
  id: string;
  date: Date;
  name: string;
  type: EventType;
  status: 'proposed' | 'confirmed' | 'invoice ready' | 'invoiced' | 'cancelled';
  revenue?: number;
}