
/**
 * 🎯 TWO-COLUMN PROJECT GENERAL TAB
 * 
 * Inspired by Resources tab design pattern:
 * - LEFT: Project Information + Calendar (stacked, 400px fixed width)
 * - RIGHT: Events List (independently scrollable, flexible width)
 * 
 * Features:
 * - Responsive: Single column on mobile, two columns on lg+
 * - Fixed height container with proper scroll management
 * - Events scroll independently from information/calendar
 */

import { ProjectTabCard } from "../shared/ProjectTabCard";
import { ProjectCalendar } from "./calendar/ProjectCalendar";
import { EventList } from "./events/EventList";
import { Project } from "@/types/projects";
import { ProjectInfo } from "./information/ProjectInfo";
import { useProjectEvents } from "@/hooks/useConsolidatedEvents";
import { Calendar, Info, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { COMPONENT_CLASSES, RESPONSIVE } from "@/design-system";
import { STATUS_COLORS } from "@/components/dashboard/shared/StatusCard";

interface ProjectGeneralTabProps {
  project: Project;
  projectId: string;
}

export function ProjectGeneralTab({ project, projectId }: ProjectGeneralTabProps) {
  // PERFORMANCE OPTIMIZATION: Use consolidated events hook instead of separate hooks + queries
  const { events, isLoading, updateEventStatus } = useProjectEvents(projectId);
  
  // Use info colors to match Resources tab styling
  const infoColors = STATUS_COLORS.info;

  const handleStatusChange = async (event, newStatus) => {
    await updateEventStatus(event, newStatus);
  };

  const handleEditEvent = (event) => {
    // TODO: Implement edit functionality
  };

  return (
    <ProjectTabCard
      padding="sm"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-4 h-[calc(100vh-150px)] min-h-[650px] max-h-[950px] overflow-hidden">
        {/* 🎯 LEFT COLUMN: Calendar + Information Stack - Two separate components */}
        <div className="flex flex-col gap-4 h-full overflow-y-auto overscroll-contain">
          {/* Project Calendar Component */}
          <div className={cn(
            'flex flex-col overflow-hidden',
            'bg-gradient-to-br', infoColors.bg,
            'border', infoColors.border,
            'rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200'
          )}>
            {/* Calendar Header */}
            <div className="px-3 py-2.5 border-b border-border/20">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 flex-shrink-0 text-primary" />
                <h2 className="font-semibold text-lg leading-none text-foreground">Calendar</h2>
              </div>
            </div>
            
            {/* Calendar Content */}
            <div className="p-3">
              <ProjectCalendar projectId={projectId} />
            </div>
          </div>
          
          {/* Project Information Component */}
          <div className={cn(
            'flex flex-col overflow-hidden',
            'bg-gradient-to-br', infoColors.bg,
            'border', infoColors.border,
            'rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200'
          )}>
            {/* Information Header */}
            <div className="px-3 py-2.5 border-b border-border/20">
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 flex-shrink-0 text-primary" />
                <h2 className="font-semibold text-lg leading-none text-foreground">Information</h2>
              </div>
            </div>
            
            {/* Information Content */}
            <div className="p-3">
              <ProjectInfo 
                project={project} 
                events={events}
                onStatusChange={handleStatusChange}
              />
            </div>
          </div>
        </div>

        {/* 🎯 RIGHT COLUMN: Events (Independently Scrollable) */}
        <div className={cn(
          'flex flex-col h-full overflow-hidden',
          'bg-gradient-to-br', infoColors.bg,
          'border', infoColors.border,
          'rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200'
        )}>
          {/* Events Content Header - matching Resources tab pattern */}
          <div className="px-3 py-2.5 border-b border-border/20 flex-shrink-0">
            <div className={RESPONSIVE.flex.header}>
              {/* Title Section */}
              <div className="flex items-center gap-2">
                <List className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-lg text-foreground">Events</h2>
              </div>
            </div>
          </div>

          {/* Events Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="p-3">
              <EventList 
                events={events} 
                isLoading={isLoading}
                onStatusChange={handleStatusChange}
                onEdit={handleEditEvent}
              />
            </div>
          </div>
        </div>
      </div>
    </ProjectTabCard>
  );
}
