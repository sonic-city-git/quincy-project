export type EventType = "Show" | "Travel" | "Preprod" | "INT Storage" | "EXT Storage";

export interface CalendarEvent {
  date: Date;
  name: string;
  type: EventType;
}