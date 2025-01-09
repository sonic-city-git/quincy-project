import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { CalendarIcon, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EventsNeedingCrewProps {
  projectId: string;
}

export function EventsNeedingCrew({ projectId }: EventsNeedingCrewProps) {
  const { data: events, isLoading } = useQuery({
    queryKey: ['events-crew-overview', projectId],
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
            crew_member_id,
            role_id,
            daily_rate,
            hourly_rate,
            crew_members (
              id,
              name
            ),
            crew_roles (
              id,
              name,
              color
            )
          )
        `)
        .eq('project_id', projectId)
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

  if (!events?.length) {
    return (
      <div className="text-sm text-muted-foreground">
        No events scheduled yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Events & Crew Overview</h3>
      <div className="grid gap-2">
        {events.map(event => (
          <Card key={event.id} className="p-4">
            <div className="space-y-3">
              {/* Event Header */}
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
                    {event.event_types.rate_multiplier !== 1 && (
                      <span className="ml-2">
                        Rate: {event.event_types.rate_multiplier}x
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Crew Assignments */}
              {event.event_types.needs_crew ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>Crew Assignments</span>
                  </div>
                  <div className="grid gap-1.5">
                    {event.project_event_roles?.map(role => (
                      <div key={role.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Badge
                            className="text-white whitespace-nowrap"
                            style={{ 
                              backgroundColor: role.crew_roles?.color || '#666',
                            }}
                          >
                            {role.crew_roles?.name}
                          </Badge>
                          {role.crew_member_id ? (
                            <span>{role.crew_members?.name}</span>
                          ) : (
                            <span className="text-yellow-500">Unassigned</span>
                          )}
                        </div>
                        <div className="text-muted-foreground">
                          {role.daily_rate && `${role.daily_rate} NOK/day`}
                          {role.hourly_rate && role.daily_rate && ' | '}
                          {role.hourly_rate && `${role.hourly_rate} NOK/h`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  This event type doesn't require crew
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}