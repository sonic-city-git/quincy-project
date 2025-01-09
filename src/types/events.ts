export interface EventType {
  id: string;
  name: string;
  color: string;
  needs_crew?: boolean;
  rate_multiplier?: number;
}

export interface CalendarEvent {
  date: Date;
  name: string;
  type: EventType;
}