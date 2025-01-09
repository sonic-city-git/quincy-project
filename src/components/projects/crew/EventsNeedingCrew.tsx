import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";

interface EventsNeedingCrewProps {
  projectId: string;
}

export function EventsNeedingCrew({ projectId }: EventsNeedingCrewProps) {
  const { data: events, isLoading } = useQuery({
    queryKey: ['events-needing-crew', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_events')
        .select(`
          *,
          event_types (
            id,
            name,
            color,
            needs_crew,
            rate_multiplier
          ),
          project_event_roles (
            id,
            crew_member_id
          )
        `)
        .eq('project_id', projectId)
        .eq('event_types.needs_crew', true)
        .order('date', { ascending: true });

      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-zinc-800 rounded w-1/4"></div>
        <div className="h-20 bg-zinc-800 rounded"></div>
      </div>
    );
  }

  const eventsNeedingCrew = events?.filter(event => {
    const roleAssignments = event.project_event_roles || [];
    return roleAssignments.some(role => !role.crew_member_id);
  });

  if (!eventsNeedingCrew?.length) {
    return (
      <div className="text-sm text-muted-foreground">
        All events have crew assigned.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Events Needing Crew</h3>
      <div className="grid gap-2">
        {eventsNeedingCrew.map(event => (
          <Card key={event.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: event.event_types.color }}
                  />
                  <span className="font-medium">{event.name}</span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{format(new Date(event.date), 'dd.MM.yy')}</span>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Rate: {event.event_types.rate_multiplier}x
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}