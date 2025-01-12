import { Card } from "@/components/ui/card";
import { ProjectCalendar } from "@/components/projects/calendar/ProjectCalendar";
import { EventList } from "@/components/projects/calendar/EventList";
import { Project } from "@/types/projects";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchEvents } from "@/utils/eventQueries";
import { useEffect } from "react";
import { ProjectInfo } from "./ProjectInfo";
import { CalendarEvent } from "@/types/events";
import { useEventUpdate } from "@/hooks/useEventUpdate";

interface ProjectGeneralTabProps {
  project: Project;
  projectId: string;
}

export function ProjectGeneralTab({ project, projectId }: ProjectGeneralTabProps) {
  const queryClient = useQueryClient();
  const { updateEvent } = useEventUpdate(projectId);
  
  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ['events', projectId],
    queryFn: () => fetchEvents(projectId),
    enabled: !!projectId
  });

  useEffect(() => {
    if (projectId) {
      console.log('Fetching events for project:', projectId);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['calendar-events', projectId] });
    }
  }, [projectId, refetch, queryClient]);

  const handleStatusChange = async (event: CalendarEvent, newStatus: CalendarEvent['status']) => {
    const updatedEvent = { ...event, status: newStatus };
    await updateEvent(updatedEvent);
  };

  // Memoize the handler to prevent double calls
  const handleEditEvent = (event: CalendarEvent) => {
    // Only log once
    console.log('Opening edit dialog for event:', event);
  };

  return (
    <div className="space-y-8">
      <Card className="rounded-lg bg-zinc-800/45 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Calendar Section */}
          <Card className="rounded-lg bg-zinc-800/45">
            <div className="p-6">
              <ProjectCalendar projectId={projectId} />
            </div>
          </Card>
          
          {/* General Info Section */}
          <Card className="rounded-lg bg-zinc-800/45">
            <div className="p-6">
              <ProjectInfo 
                project={project} 
                events={events}
                onStatusChange={handleStatusChange}
              />
            </div>
          </Card>
        </div>
      </Card>

      {/* Event List Section */}
      <Card className="rounded-lg bg-zinc-800/45 p-6">
        <EventList 
          events={events} 
          isLoading={isLoading}
          onStatusChange={handleStatusChange}
          onEdit={handleEditEvent}
        />
      </Card>
    </div>
  );
}