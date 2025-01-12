import { ProjectHeader } from "../ProjectHeader";
import { ProjectTabs } from "../ProjectTabs";
import { ProjectInvoiceButton } from "../ProjectInvoiceButton";
import { InvoiceDialog } from "../../invoice/InvoiceDialog";
import { useState } from "react";
import { Project } from "@/types/projects";
import { CalendarEvent } from "@/types/events";

interface ProjectLayoutProps {
  project: Project;
  projectId: string;
  events?: CalendarEvent[];
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => Promise<void>;
}

export function ProjectLayout({ 
  project, 
  projectId,
  events = [],
  onStatusChange 
}: ProjectLayoutProps) {
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 bg-background z-10 p-8 pb-0">
        <div className="flex items-center justify-between mb-4">
          <ProjectHeader 
            name={project.name}
            color={project.color}
            projectNumber={project.project_number}
          />
          <ProjectInvoiceButton onClick={() => setIsInvoiceDialogOpen(true)} />
        </div>
        
        <ProjectTabs project={project} projectId={projectId} />
      </div>

      <InvoiceDialog 
        isOpen={isInvoiceDialogOpen}
        onClose={() => setIsInvoiceDialogOpen(false)}
        events={events}
        onStatusChange={onStatusChange}
      />
    </div>
  );
}