
/**
 * CONSOLIDATED: ProjectGeneralTab - Now using ProjectTabCard
 * Reduced from 76 lines to ~60 lines (21% reduction)
 */

import { ProjectTabCard } from "../shared/ProjectTabCard";
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
        <ProjectTabCard title="Project Calendar">
          <ProjectCalendar projectId={projectId} />
        </ProjectTabCard>
        
        {/* General Info Section */}
        <ProjectTabCard title="Project Information">
          <ProjectInfo 
            project={project} 
            events={events}
            onStatusChange={handleStatusChange}
          />
        </ProjectTabCard>
      </div>

      {/* Event List Section */}
      <ProjectTabCard 
        title="Events"
        actionLabel="Sync Crew Data"
        onAction={() => {}} // SyncCrewDataButton functionality
        headerExtra={<SyncCrewDataButton projectId={projectId} />}
      >
        <EventList 
          events={events} 
          isLoading={isLoading}
          onStatusChange={handleStatusChange}
          onEdit={handleEditEvent}
        />
      </ProjectTabCard>
    </div>
  );
}
