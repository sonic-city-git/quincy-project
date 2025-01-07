import { EventType } from "@/types/events";

export const EVENT_COLORS: Record<EventType, string> = {
  "Show": "bg-green-500",
  "Preprod": "bg-yellow-500",
  "Travel": "bg-blue-500",
  "INT Storage": "bg-pink-500",
  "EXT Storage": "bg-red-500"
};