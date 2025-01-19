import { Users, Check, AlertOctagon } from "lucide-react";
import { CalendarEvent } from "@/types/events";
import { useSyncCrewStatus } from "@/hooks/useSyncCrewStatus";
import { cn } from "@/lib/utils";

interface HeaderCrewIconProps {
  event: CalendarEvent;
}

export function HeaderCrewIcon({ event }: HeaderCrewIconProps) {
  const { hasProjectRoles, isSynced, isChecking } = useSyncCrewStatus(event);

  if (!hasProjectRoles) return null;
  
  return (
    <div className="flex items-center gap-2">
      <Users className="h-6 w-6 text-muted-foreground" />
      {!isChecking && (
        isSynced ? (
          <Check className={cn(
            "h-4 w-4",
            "text-green-500"
          )} />
        ) : (
          <AlertOctagon className={cn(
            "h-4 w-4",
            "text-blue-500"
          )} />
        )
      )}
    </div>
  );
}