import { CalendarEvent } from "@/types/events";
import { ReactNode } from "react";

interface EventSectionContentProps {
  children: ReactNode;
  events: CalendarEvent[];
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
}

export function EventSectionContent({ children, events, onStatusChange }: EventSectionContentProps) {
  return (
    <div className="space-y-2">
      {children}
    </div>
  );
}