
import { Card } from "@/components/ui/card";
import { ProjectCalendar } from "@/components/projects/calendar/ProjectCalendar";
import { EventList } from "@/components/projects/calendar/EventList";
import { Project } from "@/types/projects";
import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "@/utils/eventQueries";
import { useEffect } from "react";
import { ProjectInfo } from "./ProjectInfo";
import { useEventUpdate } from "@/hooks/useEventUpdate";
import { SyncCrewDataButton } from "./SyncCrewDataButton";

interface ProjectGeneralTabProps {
  project: Project;
  projectId: string;
}

export function ProjectGeneralTab({ project, projectId }: ProjectGeneralTabProps) {
  const { updateEvent } = useEventUpdate(projectId);
  
  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ['events', projectId],
    queryFn: () => fetchEvents(projectId),
    enabled: !!projectId
  });

  useEffect(() => {
    if (projectId) {
  
      refetch();
    }
  }, [projectId, refetch]);

  const handleStatusChange = async (event, newStatus) => {
    const updatedEvent = { ...event, status: newStatus };
    await updateEvent(updatedEvent);
  };

  const handleEditEvent = (event) => {
    
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Calendar Section */}
        <Card className="rounded-lg bg-zinc-800/45 p-6">
          <ProjectCalendar projectId={projectId} />
        </Card>
        
        {/* General Info Section */}
        <Card className="rounded-lg bg-zinc-800/45 p-6">
          <ProjectInfo 
            project={project} 
            events={events}
            onStatusChange={handleStatusChange}
          />
        </Card>
      </div>

      {/* Event List Section */}
      <Card className="rounded-lg bg-zinc-800/45 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Events</h3>
          <SyncCrewDataButton projectId={projectId} />
        </div>
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
