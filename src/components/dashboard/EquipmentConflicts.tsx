import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface Conflict {
  id: string;
  equipment: {
    name: string;
  } | null;
  event: {
    date: string;
    project: {
      name: string;
    } | null;
  } | null;
}

interface EquipmentConflictsProps {
  ownerId?: string;
}

export function EquipmentConflicts({ ownerId }: EquipmentConflictsProps) {
  const { data: conflicts, isLoading } = useQuery({
    queryKey: ['equipment-conflicts', ownerId],
    queryFn: async () => {
      let query = supabase
        .from('project_event_equipment')
        .select(`
          id,
          equipment:equipment_id(name),
          event:event_id(
            date,
            project:project_id(
              name,
              owner_id
            )
          )
        `)
        .limit(5);

      if (ownerId) {
        query = query.eq('event.project.owner_id', ownerId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Conflict[];
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
        <Alert key={conflict.id} variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Equipment conflict for {conflict.equipment?.name} on{' '}
            {new Date(conflict.event?.date || '').toLocaleDateString()} in project{' '}
            {conflict.event?.project?.name}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}

EquipmentConflicts.Icon = AlertTriangle;