import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useProjectDetails } from "@/hooks/useProjectDetails";
import { PageLayout } from "@/components/layout/PageLayout";
import { DetailHeader } from "@/components/projectdetail/shared/header/DetailHeader";
import { DetailTabs } from "@/components/projectdetail/shared/tabs/DetailTabs";
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
  const { data: canArchive = false, refetch: refetchArchiveStatus } = useQuery({
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
        .update({ is_archived: true })
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
      <PageLayout
        icon={Building2}
        title="Loading Project..."
        description="Please wait while we load the project details"
        iconColor="text-purple-500"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </PageLayout>
    );
  }

  if (!project) {
    return (
      <PageLayout
        icon={Building2}
        title="Project Not Found"
        description="The requested project could not be found"
        iconColor="text-red-500"
      >
        <div className="text-center py-8">
          <p className="text-lg text-muted-foreground mb-4">
            This project may have been deleted or moved.
          </p>
          <button 
            onClick={() => navigate('/projects')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Projects
          </button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      icon={Building2}
      title={
        <div className="flex items-center gap-2">
          {project.name}
          <Badge 
            variant={getProjectTypeBadgeVariant(project.project_type?.code)}
            className="whitespace-nowrap"
          >
            {project.project_type?.name || 'Artist'}
          </Badge>
        </div>
      }
      description={`Project #${String(project.project_number).padStart(4, '0')} • Manage equipment, crew, and project details`}
      iconColor="text-purple-500"
    >

      {/* Main Content - Exact same structure as Projects page */}
      <div className="space-y-4">
        {/* Project Header with Tabs - Outside content for better performance */}
        <DetailHeader
          activeTab={tab as 'general' | 'equipment' | 'crew' | 'financial'}
          onTabChange={handleTabChange as (tab: 'general' | 'equipment' | 'crew' | 'financial') => void}
          canArchive={canArchive}
          onArchiveClick={handleArchiveClick}
          onRefreshArchiveStatus={refetchArchiveStatus}
        />
        
        {/* Tab Content */}
        <div className="space-y-4">
          <Tabs value={tab} onValueChange={handleTabChange}>
            <DetailTabs 
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
    </PageLayout>
  );
};

export default ProjectDetail;