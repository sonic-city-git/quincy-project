import { Users } from "lucide-react";
import { CalendarEvent } from "@/types/events";
import { useSyncCrewStatus } from "@/hooks/useSyncCrewStatus";
import { cn } from "@/lib/utils";

interface HeaderCrewIconProps {
  event: CalendarEvent;
}

export function HeaderCrewIcon({ event }: HeaderCrewIconProps) {
  const { hasProjectRoles, isSynced, isChecking } = useSyncCrewStatus(event);

  // Show the icon if there are project roles, regardless of event type
  if (!hasProjectRoles) return null;
  
  return (
    <div className="flex items-center gap-2">
      <Users 
        className={cn(
          "h-6 w-6",
          isSynced ? "text-green-500" : "text-blue-500"
        )} 
      />
    </div>
  );
}