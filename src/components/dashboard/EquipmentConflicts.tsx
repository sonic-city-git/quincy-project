import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDisplayDate } from "@/utils/dateFormatters";
import { useEquipmentConflicts } from "@/hooks/useConsolidatedConflicts";

interface EquipmentConflict {
  equipmentId: string;
  equipmentName: string;
  date: string;
  totalStock: number;
  totalUsed: number;
  overbooked: number;
  conflictingEvents: {
    eventName: string;
    projectName: string;
    quantity: number;
  }[];
}

interface EquipmentConflictsProps {
  ownerId?: string;
}

export function EquipmentConflicts({ ownerId }: EquipmentConflictsProps) {
  // PERFORMANCE FIX: Use consolidated hook that leverages planner's existing calculations
  // instead of running duplicate Supabase queries
  const { conflicts, isLoading } = useEquipmentConflicts(ownerId);
  
  // Limit to 5 most recent conflicts for display
  const displayConflicts = conflicts.slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!displayConflicts?.length) {
    return (
      <div className="text-muted-foreground">
        No equipment conflicts found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {displayConflicts.map((conflict) => (
        <Alert key={`${conflict.equipmentId}-${conflict.date}`} variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">
                {conflict.equipmentName} - {formatDisplayDate(new Date(conflict.date))}
              </div>
              <div className="text-sm">
                Overbooked by {conflict.overbooked} (Stock: {conflict.totalStock}, Used: {conflict.totalUsed})
              </div>
              <div className="text-xs">
                Events: {conflict.conflictingEvents.map(event => 
                  `${event.projectName}: ${event.eventName} (${event.quantity}x)`
                ).join(' • ')}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}

EquipmentConflicts.Icon = AlertTriangle;