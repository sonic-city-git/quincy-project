import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDisplayDate } from "@/utils/dateFormatters";

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
  const { data: conflicts, isLoading } = useQuery({
    queryKey: ['equipment-conflicts', ownerId],
    queryFn: async () => {
      // Get all equipment bookings grouped by equipment and date
      let query = supabase
        .from('project_event_equipment')
        .select(`
          equipment_id,
          quantity,
          equipment:equipment_id!inner (
            name,
            stock
          ),
          project_events!inner (
            date,
            name,
            project:projects!inner (
              name,
              owner_id
            )
          )
        `);

      if (ownerId) {
        query = query.eq('project_events.project.owner_id', ownerId);
      }

      const { data: bookings, error } = await query;
      if (error) throw error;

      // Group bookings by equipment and date to find conflicts
      const conflictMap = new Map<string, Map<string, any[]>>();
      
      bookings?.forEach(booking => {
        const equipmentId = booking.equipment_id;
        const date = booking.project_events.date;
        const key = `${equipmentId}-${date}`;
        
        if (!conflictMap.has(equipmentId)) {
          conflictMap.set(equipmentId, new Map());
        }
        
        const equipmentMap = conflictMap.get(equipmentId)!;
        if (!equipmentMap.has(date)) {
          equipmentMap.set(date, []);
        }
        
        equipmentMap.get(date)!.push({
          quantity: booking.quantity || 0,
          eventName: booking.project_events.name,
          projectName: booking.project_events.project.name,
          equipmentName: booking.equipment.name,
          stock: booking.equipment.stock || 0
        });
      });

      // Find actual conflicts where total usage exceeds stock
      const actualConflicts: EquipmentConflict[] = [];
      
      conflictMap.forEach((dateMap, equipmentId) => {
        dateMap.forEach((events, date) => {
          const totalUsed = events.reduce((sum, event) => sum + event.quantity, 0);
          const stock = events[0]?.stock || 0;
          
          if (totalUsed > stock) {
            actualConflicts.push({
              equipmentId,
              equipmentName: events[0]?.equipmentName || 'Unknown',
              date,
              totalStock: stock,
              totalUsed,
              overbooked: totalUsed - stock,
              conflictingEvents: events.map(event => ({
                eventName: event.eventName,
                projectName: event.projectName,
                quantity: event.quantity
              }))
            });
          }
        });
      });

      return actualConflicts.slice(0, 5); // Limit to 5 most recent conflicts
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!conflicts?.length) {
    return (
      <div className="text-muted-foreground">
        No equipment conflicts found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conflicts.map((conflict) => (
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