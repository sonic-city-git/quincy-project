import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Project } from "@/types/projects";
import { Archive, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProjectHeaderProps {
  project: Project;
  value: string;
  onValueChange: (value: string) => void;
}

export function ProjectHeader({ project, value, onValueChange }: ProjectHeaderProps) {
  const navigate = useNavigate();

  // Query to check if project can be archived
  const { data: canArchive } = useQuery({
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

      // Can archive if there are no open events (all events are either invoiced or cancelled)
      return data.length === 0;
    }
  });

  const handleArchive = async () => {
    if (!canArchive) {
      toast.error("Cannot archive project with open events");
      return;
    }

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

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">
          {project.name}
        </h2>
        <p className="text-sm text-muted-foreground">
          Project #{String(project.project_number).padStart(4, '0')}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleArchive}
          disabled={!canArchive}
          className="gap-2"
        >
          <Archive className="h-4 w-4" />
          Archive Project
        </Button>
        <Tabs value={value} onValueChange={onValueChange} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="crew">Crew</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}