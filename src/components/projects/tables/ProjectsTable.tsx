import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Calendar, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/hooks/useProjects";
import { ProjectFilters } from "../ProjectsHeader";
import { COMPONENT_CLASSES, cn } from "@/design-system";

// Extended project type with joined data
type ProjectWithJoins = {
  id: string;
  name: string;
  color: string | null;
  created_at: string;
  customer_id: string | null;
  is_archived: boolean | null;
  owner_id: string | null;
  project_number: number;
  project_type_id: string | null;
  to_be_invoiced: number | null;
  updated_at: string;
  owner?: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
  customer?: {
    id: string;
    name: string;
  } | null;
  project_type?: {
    id: string;
    name: string;
    code: string;
    price_multiplier: number | null;
  } | null;
};

interface ProjectsTableProps {
  activeTab: 'active' | 'archived';
  filters: ProjectFilters;
}

export function ProjectsTable({ activeTab, filters }: ProjectsTableProps) {
  const { projects, loading } = useProjects();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const navigate = useNavigate();

  // Project color badge styling using design system
  const getProjectColorStyles = (color: string | null | undefined) => {
    if (!color) {
      // Fallback using CSS variables
      return {
        backgroundColor: 'hsl(var(--muted))', 
        color: 'hsl(var(--muted-foreground))',
        border: '1px solid hsl(var(--border))'
      };
    }
    
    return {
      backgroundColor: color,
      color: '#FFFFFF',
      border: `1px solid ${color}`,
      boxShadow: `0 0 0 1px ${color}20`
    };
  };

  const handleProjectClick = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  // Filter projects based on tab and filters
  const filteredProjects = (projects as ProjectWithJoins[])?.filter(project => {
    // Tab filtering based on archived status
    if (activeTab === 'archived' && !project.is_archived) return false;
    if (activeTab === 'active' && project.is_archived) return false;

    // Search filtering
    if (filters.search && project.name && !project.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }

    // Owner filtering
    if (filters.owner && filters.owner !== 'all' && project.owner?.name !== filters.owner) {
      return false;
    }

    // Note: No status filtering needed - tabs handle active/archived filtering

    return true;
  }) || [];



  if (loading) {
    return (
      <div className="w-full">
        {/* Sticky table header */}
        <div className={cn("sticky top-[136px] z-20", COMPONENT_CLASSES.table.header)}>
          <div className="grid grid-cols-[240px_2fr_160px_80px] gap-6 p-4 bg-muted/50 font-semibold text-sm">
            <div>Owner</div>
            <div className="text-center">Project Name</div>
                            <div>Amount</div>
            <div></div>
          </div>
        </div>
        
        {/* Loading skeleton */}
        <div className="border-x border-b border-border rounded-b-lg bg-background">
          <div className="divide-y divide-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[2fr_120px_120px] sm:grid-cols-[2fr_180px_120px] gap-3 sm:gap-4 p-3 sm:p-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3 sm:w-2/3" />
                </div>
                <div className="flex justify-center sm:justify-start">
                  <Skeleton className="h-6 w-6 rounded-full sm:w-24 sm:h-4 sm:rounded" />
                </div>
                <div className="flex justify-end">
                  <Skeleton className="h-4 w-12 sm:w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (filteredProjects.length === 0) {
    const getEmptyMessage = () => {
      if (activeTab === 'active') return 'No active projects found';
      if (activeTab === 'archived') return 'No archived projects found';
      
      if (filters.search) {
        return 'No projects match your search';
      }
      
      return 'No projects found. Create your first project to get started!';
    };

    return (
      <div className="w-full">
        {/* Sticky table header positioned right after ProjectsHeader */}
        <div className="sticky top-[124px] z-30 bg-background border-x border-b border-border">
          <div className="grid grid-cols-[2fr_120px_120px] sm:grid-cols-[2fr_180px_120px] gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/50 font-semibold text-sm">
            <div>Project Name</div>
            <div className="text-center sm:text-left">Owner</div>
            <div className="text-right">PGA</div>
          </div>
        </div>
        
        {/* Empty state content */}
        <div className="border-x border-b border-border rounded-b-lg bg-background">
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">{getEmptyMessage()}</p>
            {!filters.search && (
              <p className="text-sm">Projects help you organize crew, equipment, and schedules for your productions.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Sticky table header positioned right after ProjectsHeader */}
      <div className={cn("sticky top-[124px] z-30", COMPONENT_CLASSES.table.container)}>
        <div className={cn("grid grid-cols-[2fr_120px_120px] sm:grid-cols-[2fr_180px_120px] gap-3 sm:gap-4 p-3 sm:p-4 font-semibold text-sm", COMPONENT_CLASSES.table.header)}>
          <div>Project Name</div>
          <div className="text-center sm:text-left">Owner</div>
          <div className="text-right">PGA</div>
        </div>
      </div>
      
      {/* Table content */}
      <div className={cn("rounded-b-lg", COMPONENT_CLASSES.table.container)}>
        <div className="divide-y divide-border">
          {filteredProjects.map((project) => {
            const projectColorStyles = getProjectColorStyles(project.color);
            
            return (
              <div 
                key={project.id}
                className={cn("grid grid-cols-[2fr_120px_120px] sm:grid-cols-[2fr_180px_120px] gap-3 sm:gap-4 p-3 sm:p-4 cursor-pointer group border-l-4 border-l-transparent", COMPONENT_CLASSES.table.row)}
                style={{}}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderLeftColor = project.color || 'hsl(var(--muted-foreground))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderLeftColor = 'transparent';
                }}
                onClick={() => handleProjectClick(project.id)}
              >
                {/* Project Name - LEFT & PRIMARY */}
                <div className="flex flex-col space-y-1.5 min-w-0">
                  <div
                    className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-sm sm:text-base font-semibold transition-all duration-200 group-hover:shadow-md max-w-fit"
                    style={projectColorStyles}
                  >
                    <span className="truncate block">{project.name}</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      #{String(project.project_number).padStart(4, '0')}
                    </span>
                    {project.project_type && (
                      <Badge variant="outline" className="text-xs px-1 sm:px-1.5 py-0 hidden sm:inline-flex">
                        {project.project_type.name}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Owner - Responsive: Avatar only on mobile, Avatar + Name on desktop */}
                <div className="flex items-center justify-center sm:justify-start gap-2 min-w-0">
                  {project.owner?.avatar_url ? (
                    <img 
                      src={project.owner.avatar_url} 
                      alt={project.owner.name}
                      className="h-6 w-6 sm:h-6 sm:w-6 rounded-full ring-2 ring-background shadow-sm flex-shrink-0"
                      title={project.owner.name} // Tooltip for mobile
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-muted-foreground">
                        {project.owner?.name ? project.owner.name.charAt(0).toUpperCase() : '?'}
                      </span>
                    </div>
                  )}
                  <span className="hidden sm:inline text-sm font-medium truncate">
                    {project.owner?.name || (
                      <span className="text-muted-foreground italic">No Owner</span>
                    )}
                  </span>
                </div>
                
                {/* PGA (Per Gig Average) - RIGHT ALIGNED */}
                <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                  <span className="text-xs sm:text-sm font-medium">
                    {project.to_be_invoiced ? `${(project.to_be_invoiced / 1000).toFixed(0)}k` : (
                      <span className="text-muted-foreground italic text-xs">—</span>
                    )}
                  </span>
                  <DollarSign className="h-3 w-3 text-muted-foreground ml-0.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}