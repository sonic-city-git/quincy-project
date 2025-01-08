import { EventType } from "@/types/events";

export const EVENT_COLORS: Record<EventType, string> = {
  "Show": "bg-purple-600",
  "Preprod": "bg-blue-600",
  "Travel": "bg-orange-500",
  "INT Storage": "bg-red-600",
  "EXT Storage": "bg-violet-600"
};