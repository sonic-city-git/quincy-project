import { useParams } from "react-router-dom";
import { useProjectDetails } from "@/hooks/useProjectDetails";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchEvents } from "@/utils/eventQueries";
import { ProjectHeader } from "@/components/projects/detail/ProjectHeader";
import { useState } from "react";
import { InvoiceDialog } from "@/components/projects/invoice/InvoiceDialog";
import { supabase } from "@/integrations/supabase/client";
import { CalendarEvent } from "@/types/events";
import { useToast } from "@/hooks/use-toast";
import { ProjectTabs } from "@/components/projects/detail/ProjectTabs";
import { ProjectInvoiceButton } from "@/components/projects/detail/ProjectInvoiceButton";

const ProjectDetail = () => {
  const { id } = useParams();
  const { project, loading } = useProjectDetails(id);
  const { toast } = useToast();
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: events } = useQuery({
    queryKey: ['events', id],
    queryFn: () => fetchEvents(id || ''),
    enabled: !!id
  });

  const handleStatusChange = async (event: CalendarEvent, newStatus: CalendarEvent['status']) => {
    if (!id) return;

    const queryKeysToUpdate = [
      ['events', id],
      ['calendar-events', id]
    ];

    try {
      const updatedEvent = { ...event, status: newStatus };
      
      queryKeysToUpdate.forEach(queryKey => {
        queryClient.setQueryData(queryKey, (oldData: CalendarEvent[] | undefined) => {
          if (!oldData) return [updatedEvent];
          return oldData.map(e => 
            e.id === event.id ? updatedEvent : e
          );
        });
      });

      const { error } = await supabase
        .from('project_events')
        .update({ status: newStatus })
        .eq('id', event.id)
        .eq('project_id', id);

      if (error) throw error;

      const { dismiss } = toast({
        title: "Status Updated",
        description: `Event status changed to ${newStatus}`,
      });

      setTimeout(() => {
        dismiss();
      }, 600);

      await Promise.all(
        queryKeysToUpdate.map(queryKey =>
          queryClient.invalidateQueries({ queryKey })
        )
      );

    } catch (error) {
      console.error('Error updating event status:', error);
      
      queryKeysToUpdate.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      
      toast({
        title: "Error",
        description: "Failed to update event status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!project) {
    return <div className="p-8">Project not found</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 bg-background z-10 p-8 pb-0 space-y-6">
        <div className="flex items-center justify-between">
          <ProjectHeader 
            name={project.name}
            color={project.color}
            projectNumber={project.project_number}
          />
          <ProjectInvoiceButton onClick={() => setIsInvoiceDialogOpen(true)} />
        </div>
        
        <ProjectTabs project={project} projectId={id || ''} />
      </div>

      <InvoiceDialog 
        isOpen={isInvoiceDialogOpen}
        onClose={() => setIsInvoiceDialogOpen(false)}
        events={events || []}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

export default ProjectDetail;