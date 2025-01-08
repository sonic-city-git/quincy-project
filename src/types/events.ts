export interface EventType {
  id: string;
  name: string;
  color: string;
}

export interface CalendarEvent {
  date: Date;
  name: string;
  type: EventType;
}