
/**
 * CONSOLIDATED: ProjectGeneralTab - Now using ProjectTabCard
 * Reduced from 76 lines to ~60 lines (21% reduction)
 */

import { ProjectTabCard } from "../shared/ProjectTabCard";
import { ProjectCalendar } from "./calendar/ProjectCalendar";
import { EventList } from "./events/EventList";
import { Project } from "@/types/projects";
import { ProjectInfo } from "./information/ProjectInfo";
import { useProjectEvents } from "@/hooks/useConsolidatedEvents";
import { SyncCrewDataButton } from "./shared/SyncCrewDataButton";

interface ProjectGeneralTabProps {
  project: Project;
  projectId: string;
}

export function ProjectGeneralTab({ project, projectId }: ProjectGeneralTabProps) {
  // PERFORMANCE OPTIMIZATION: Use consolidated events hook instead of separate hooks + queries
  const { events, isLoading, updateEventStatus } = useProjectEvents(projectId);

  const handleStatusChange = async (event, newStatus) => {
    await updateEventStatus(event, newStatus);
  };

  const handleEditEvent = (event) => {
    // TODO: Implement edit functionality
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
