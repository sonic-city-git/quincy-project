import { getStatusIcon } from "@/utils/eventFormatters";
import { CalendarEvent } from "@/types/events";

interface StatusIconProps {
  status: CalendarEvent['status'];
}

export function StatusIcon({ status }: StatusIconProps) {
  return (
    <div className="h-6 w-6 flex items-center justify-center">
      {getStatusIcon(status.toLowerCase() as CalendarEvent['status'])}
    </div>
  );
}