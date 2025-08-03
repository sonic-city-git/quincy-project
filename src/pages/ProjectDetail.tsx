import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useProjectDetails } from "@/hooks/useProjectDetails";
import { ProjectDetailTabsHeader } from "@/components/projects/detail/ProjectDetailTabsHeader";
import { ProjectTabs } from "@/components/projects/detail/ProjectTabs";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ProjectDetail = () => {
  const { id } = useParams();
  const { project, loading } = useProjectDetails(id);
  const navigate = useNavigate();
  const location = useLocation();
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const queryClient = useQueryClient();
  
  // Tab management
  const tab = location.hash.replace('#', '') || 'general';

  const handleTabChange = (value: string) => {
    navigate(`${location.pathname}#${value}`, { replace: true });
  };

  useEffect(() => {
    if (!location.hash) {
      navigate(`${location.pathname}#general`, { replace: true });
    }
  }, [location.pathname, location.hash, navigate]);

  // Check if project can be archived (no open events)
  const { data: canArchive = false } = useQuery({
    queryKey: ['project-archive-status', project?.id],
    queryFn: async () => {
      if (!project?.id) return false;
      
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
    },
    enabled: !!project?.id,
  });

  const handleArchive = async () => {
    if (!project?.id) return;
    
    try {
      const { error } = await supabase
        .from('projects')
        .update({ archived: true })
        .eq('id', project.id);

      if (error) throw error;

      toast.success("Project archived successfully");
      queryClient.invalidateQueries({ queryKey: ['projects'] });
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

  const getProjectTypeBadgeVariant = (code: string | undefined) => {
    switch (code) {
      case 'artist':
        return 'default';
      case 'corporate':
        return 'secondary';
      case 'broadcast':
        return 'destructive';
      case 'dry_hire':
        return 'outline';
      default:
        return 'default';
    }
  };



  if (loading) {
    return (
      <div className="container max-w-[1600px] p-8">
        <div className="flex items-center gap-4 mb-8">
          <Building2 className="h-8 w-8 text-purple-500" />
          <div>
            <h1 className="text-3xl font-bold">Loading Project...</h1>
            <p className="text-muted-foreground">Please wait while we load the project details</p>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container max-w-[1600px] p-8">
        <div className="flex items-center gap-4 mb-8">
          <Building2 className="h-8 w-8 text-purple-500" />
          <div>
            <h1 className="text-3xl font-bold">Project Not Found</h1>
            <p className="text-muted-foreground">The requested project could not be found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-[1600px] p-8">
      {/* Header - Exact same as Projects page */}
      <div className="flex items-center gap-4 mb-8">
        <Building2 className="h-8 w-8 text-purple-500" />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <Badge 
              variant={getProjectTypeBadgeVariant(project.project_type?.code)}
              className="whitespace-nowrap"
            >
              {project.project_type?.name || 'Artist'}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Project #{String(project.project_number).padStart(4, '0')} • 
            Manage equipment, crew, and project details
          </p>
        </div>
      </div>

      {/* Main Content - Exact same structure as Projects page */}
      <div className="space-y-4">
        {/* Project Header with Tabs - Outside content for better performance */}
        <ProjectDetailTabsHeader
          activeTab={tab as 'general' | 'equipment' | 'crew' | 'financial'}
          onTabChange={handleTabChange as (tab: 'general' | 'equipment' | 'crew' | 'financial') => void}
          canArchive={canArchive}
          onArchiveClick={handleArchiveClick}
        />
        
        {/* Tab Content */}
        <div className="space-y-4">
          <Tabs value={tab} onValueChange={handleTabChange}>
            <ProjectTabs 
              project={project}
              projectId={id || ''}
              value={tab}
            />
          </Tabs>
        </div>
      </div>

      {/* Archive Dialog */}
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
  );
};

export default ProjectDetail;