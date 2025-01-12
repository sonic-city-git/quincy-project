import { Card } from "@/components/ui/card";
import { ProjectCalendar } from "@/components/projects/calendar/ProjectCalendar";
import { EventList } from "@/components/projects/calendar/EventList";
import { Project } from "@/types/projects";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchEvents } from "@/utils/eventQueries";
import { useEffect } from "react";
import { ProjectInfo } from "./ProjectInfo";

interface ProjectGeneralTabProps {
  project: Project;
  projectId: string;
}

export function ProjectGeneralTab({ project, projectId }: ProjectGeneralTabProps) {
  const queryClient = useQueryClient();
  
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

  return (
    <div className="space-y-8">
      <Card className="bg-zinc-800/45 hover:bg-zinc-800/50 transition-colors p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Calendar Section */}
          <Card className="bg-zinc-900/50 hover:bg-zinc-900/60 transition-colors">
            <div className="p-6">
              <ProjectCalendar projectId={projectId} />
            </div>
          </Card>
          
          {/* General Info Section */}
          <Card className="bg-zinc-900/50 hover:bg-zinc-900/60 transition-colors">
            <div className="p-6">
              <ProjectInfo project={project} />
            </div>
          </Card>
        </div>
      </Card>

      {/* Event List Section */}
      <Card className="bg-zinc-800/45 hover:bg-zinc-800/50 transition-colors p-6">
        <EventList 
          events={events} 
          projectId={projectId}
          isLoading={isLoading}
        />
      </Card>
    </div>
  );
}