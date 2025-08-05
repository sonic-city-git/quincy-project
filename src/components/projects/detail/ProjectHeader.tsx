import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Project } from "@/types/projects";
import { Archive, MoreVertical, Settings, Layers, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { RESPONSIVE, STATUS_PATTERNS, cn } from "@/design-system";

interface ProjectHeaderProps {
  project: Project;
  value: string;
  onValueChange: (value: string) => void;
}

// Tab configuration using design system patterns
const TAB_CONFIG = {
  general: {
    label: 'General',
    icon: Settings,
    activeClasses: 'data-[state=active]:bg-secondary/10 data-[state=active]:text-secondary'
  },
  projectresources: {
    label: 'Variants',
    icon: Layers,
    activeClasses: 'data-[state=active]:bg-primary/10 data-[state=active]:text-primary'
  },
  financial: {
    label: 'Financial',
    icon: DollarSign,
    activeClasses: 'data-[state=active]:bg-accent/10 data-[state=active]:text-accent'
  }
} as const;

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

  // Listen for project events status changes
  useEffect(() => {
    const channel = supabase
      .channel('project_events_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
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
      
      // Invalidate projects query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['projects'] });
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

  const getProjectTypeBadgeStyles = (code: string | undefined) => {
    switch (code) {
      case 'artist':
        return cn(STATUS_PATTERNS.info.bg, STATUS_PATTERNS.info.border, STATUS_PATTERNS.info.text, "border");
      case 'corporate':
        return cn(STATUS_PATTERNS.success.bg, STATUS_PATTERNS.success.border, STATUS_PATTERNS.success.text, "border");
      case 'broadcast':
        return cn(STATUS_PATTERNS.critical.bg, STATUS_PATTERNS.critical.border, STATUS_PATTERNS.critical.text, "border");
      case 'dry_hire':
        return cn(STATUS_PATTERNS.operational.bg, STATUS_PATTERNS.operational.border, STATUS_PATTERNS.operational.text, "border");
      default:
        return cn(STATUS_PATTERNS.info.bg, STATUS_PATTERNS.info.border, STATUS_PATTERNS.info.text, "border");
    }
  };

  return (
    <div className={cn(RESPONSIVE.flex.header, "py-6")}>
      {/* Project Title and Badge */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {project.name}
          </h1>
          <div 
            className={cn(
              "px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap",
              getProjectTypeBadgeStyles(project.project_type?.code)
            )}
            aria-label={`Project type: ${project.project_type?.name || 'Artist'}`}
          >
            {project.project_type?.name || 'Artist'}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Project #{String(project.project_number).padStart(4, '0')}
        </p>
      </div>

      {/* Actions and Tabs */}
      <div className="flex items-center gap-4">
        {/* Responsive Tabs */}
        <Tabs value={value} onValueChange={onValueChange} className="w-full max-w-sm md:max-w-md">
          <TabsList className={cn("grid w-full", `grid-cols-${Object.keys(TAB_CONFIG).length}`)}>
            {Object.entries(TAB_CONFIG).map(([tabKey, config]) => {
              const Icon = config.icon;
              return (
                <TabsTrigger 
                  key={tabKey}
                  value={tabKey}
                  className={cn(
                    "flex items-center gap-1.5 transition-colors",
                    config.activeClasses
                  )}
                  aria-label={`Switch to ${config.label} tab`}
                >
                  <Icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{config.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              aria-label="Project actions menu"
              className="hover:bg-muted/50"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={handleArchiveClick}
              disabled={!canArchive}
              className={cn(
                "gap-2",
                !canArchive && "opacity-50 cursor-not-allowed"
              )}
            >
              <Archive className="h-4 w-4" />
              <span>Archive Project</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Archive Confirmation Dialog */}
        <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive Project</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to archive project #{String(project.project_number).padStart(4, '0')} - {project.name}?
                {" "}Archived projects will no longer appear in the main project list but can be restored later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleArchive}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Archive Project
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}