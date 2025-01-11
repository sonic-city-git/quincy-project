import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectDetails } from "@/hooks/useProjectDetails";
import { Card } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchEvents } from "@/utils/eventQueries";
import { Button } from "@/components/ui/button";
import { Receipt } from "lucide-react";
import { ProjectHeader } from "@/components/projects/detail/ProjectHeader";
import { ProjectGeneralTab } from "@/components/projects/detail/ProjectGeneralTab";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { InvoiceDialog } from "@/components/projects/invoice/InvoiceDialog";
import { supabase } from "@/integrations/supabase/client";
import { CalendarEvent } from "@/types/events";

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
      
      // Update all relevant caches optimistically
      queryKeysToUpdate.forEach(queryKey => {
        queryClient.setQueryData(queryKey, (oldData: CalendarEvent[] | undefined) => {
          if (!oldData) return [updatedEvent];
          return oldData.map(e => 
            e.id === event.id ? updatedEvent : e
          );
        });
      });

      // Update the server
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

  const handleInvoice = () => {
    setIsInvoiceDialogOpen(true);
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
        <ProjectHeader 
          name={project.name}
          color={project.color}
          projectNumber={project.project_number}
        />
        
        <Tabs defaultValue="general" className="w-full">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="equipment">Equipment</TabsTrigger>
              <TabsTrigger value="crew">Crew</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
            </TabsList>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleInvoice}
            >
              <Receipt className="h-4 w-4" />
              Invoice
            </Button>
          </div>

          <TabsContent value="general">
            <ProjectGeneralTab 
              project={project}
              events={events || []}
              projectId={id || ''}
            />
          </TabsContent>

          <TabsContent value="equipment">
            <Card className="p-6">
              <h2 className="text-xl font-semibold">Equipment</h2>
            </Card>
          </TabsContent>

          <TabsContent value="crew">
            <Card className="p-6">
              <h2 className="text-xl font-semibold">Crew</h2>
            </Card>
          </TabsContent>

          <TabsContent value="financial">
            <Card className="p-6">
              <h2 className="text-xl font-semibold">Financial</h2>
            </Card>
          </TabsContent>
        </Tabs>
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