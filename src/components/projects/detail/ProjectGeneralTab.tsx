import { Card } from "@/components/ui/card";
import { ProjectCalendar } from "@/components/projects/calendar/ProjectCalendar";
import { CustomerSelect } from "@/components/projects/forms/CustomerSelect";
import { OwnerSelect } from "@/components/projects/forms/OwnerSelect";
import { EventList } from "@/components/projects/calendar/EventList";
import { format, parseISO } from "date-fns";
import { Project } from "@/types/projects";
import { CalendarEvent } from "@/types/events";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchEvents } from "@/utils/eventQueries";
import { useEffect } from "react";

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

  // Fetch events when component mounts
  useEffect(() => {
    if (projectId) {
      console.log('Fetching events for project:', projectId);
      refetch();
      
      // Also invalidate the calendar events query to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['calendar-events', projectId] });
    }
  }, [projectId, refetch, queryClient]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(parseISO(dateString), 'dd.MM.yy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-';
    return new Intl.NumberFormat('no-NO', { 
      style: 'currency', 
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
          <div className="w-full">
            <ProjectCalendar projectId={projectId} />
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Customer</label>
              <CustomerSelect
                value={project.customer_id || ''}
                onChange={() => {}}
                required={false}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Owner</label>
              <OwnerSelect
                value={project.owner_id || ''}
                onChange={() => {}}
                required={false}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Last Invoiced</label>
              <div className="text-sm text-muted-foreground">
                {formatDate(project.created_at)}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">To be Invoiced</label>
              <div className="text-sm text-muted-foreground">
                {formatCurrency(project.to_be_invoiced)}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <EventList 
          events={events} 
          projectId={projectId}
          isLoading={isLoading}
        />
      </Card>
    </div>
  );
}