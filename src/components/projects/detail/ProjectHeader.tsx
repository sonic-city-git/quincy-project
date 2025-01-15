import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Project } from "@/types/projects";
import { Archive, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";

interface ProjectHeaderProps {
  project: Project;
  value: string;
  onValueChange: (value: string) => void;
}

export function ProjectHeader({ project, value, onValueChange }: ProjectHeaderProps) {
  const navigate = useNavigate();
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: canArchive, refetch: refetchArchiveStatus } = useQuery({
    queryKey: ['project-archive-status', project.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_events')
        .select('status')
        .eq('project_id', project.id)
        .not('status', 'in', '("invoiced","cancelled")');

      if (error) {
        console.error('Error checking project status:', error);
        return false;
      }

      return data.length === 0;
    }
  });

  // Refetch archive status when events are updated
  useEffect(() => {
    const channel = supabase
      .channel('project_events_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'project_events',
          filter: `project_id=eq.${project.id}`,
        },
        () => {
          refetchArchiveStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [project.id, refetchArchiveStatus]);

  const handleArchive = async () => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ is_archived: true })
        .eq('id', project.id);

      if (error) throw error;

      toast.success("Project archived successfully");
      navigate('/projects');
    } catch (error) {
      console.error('Error archiving project:', error);
      toast.error("Failed to archive project");
    }
  };

  const handleArchiveClick = () => {
    if (!canArchive) {
      toast.warning("Cannot archive project with open events. All events must be cancelled or invoiced first.");
      return;
    }
    setShowArchiveDialog(true);
  };

  return (
    <div className="flex items-center justify-between py-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">
          {project.name}
        </h2>
        <p className="text-sm text-muted-foreground">
          Project #{String(project.project_number).padStart(4, '0')}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <Tabs value={value} onValueChange={onValueChange} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger 
              value="general"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              General
            </TabsTrigger>
            <TabsTrigger 
              value="equipment"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              Equipment
            </TabsTrigger>
            <TabsTrigger 
              value="crew"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              Crew
            </TabsTrigger>
            <TabsTrigger 
              value="financial"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              Financial
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleArchiveClick}
              disabled={!canArchive}
              className="gap-2"
            >
              <Archive className="h-4 w-4" />
              Archive Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to archive this project?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will archive project #{String(project.project_number).padStart(4, '0')} - {project.name}.
                Archived projects will no longer appear in the main project list.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleArchive}>Archive Project</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}