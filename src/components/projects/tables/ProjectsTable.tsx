import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Calendar, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/hooks/useProjects";
import { ProjectFilters } from "../ProjectsHeader";

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

  // Project color badge styling
  const getProjectColorStyles = (color: string | null | undefined) => {
    if (!color) {
      // Fallback color if project has no color
      return {
        backgroundColor: '#64748b', // slate-500
        color: '#FFFFFF',
        border: '1px solid #475569'
      };
    }
    
    return {
      backgroundColor: color, // Full project color
      color: '#FFFFFF',
      border: `1px solid ${color}`,
      boxShadow: `0 0 0 1px ${color}20` // Subtle glow effect
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
        <div className="sticky top-[136px] z-20 bg-background border-x border-b border-border">
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
              <div key={i} className="grid grid-cols-[240px_2fr_160px_80px] gap-6 p-4">
                <Skeleton className="h-4 w-32" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-8" />
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
        <div className="sticky top-[136px] z-20 bg-background border-x border-b border-border">
          <div className="grid grid-cols-[240px_2fr_160px_80px] gap-6 p-4 bg-muted/50 font-semibold text-sm">
            <div>Owner</div>
            <div className="text-center">Project Name</div>
                            <div>Amount</div>
            <div></div>
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
      <div className="sticky top-[136px] z-20 bg-background border-x border-b border-border">
        <div className="grid grid-cols-[240px_2fr_160px_80px] gap-6 p-4 bg-muted/50 font-semibold text-sm">
          <div>Owner</div>
          <div>Project Name</div>
                          <div>Amount</div>
          <div></div>
        </div>
      </div>
      
      {/* Table content */}
      <div className="border-x border-b border-border rounded-b-lg bg-background">
        <div className="divide-y divide-border">
          {filteredProjects.map((project) => {
            const projectColorStyles = getProjectColorStyles(project.color);
            
            return (
              <div 
                key={project.id}
                className="grid grid-cols-[240px_2fr_160px_80px] gap-6 p-4 cursor-pointer hover:bg-muted/50 transition-all duration-200 group border-l-4 border-l-transparent"
                style={{}}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderLeftColor = project.color || '#64748b';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderLeftColor = 'transparent';
                }}
                onClick={() => handleProjectClick(project.id)}
              >
                {/* Owner */}
                <div className="flex items-center gap-2">
                  {project.owner?.avatar_url && (
                    <img 
                      src={project.owner.avatar_url} 
                      alt={project.owner.name}
                      className="h-6 w-6 rounded-full ring-2 ring-background shadow-sm"
                    />
                  )}
                  <span className="text-sm font-medium truncate">
                    {project.owner?.name || (
                      <span className="text-muted-foreground italic">No Owner</span>
                    )}
                  </span>
                </div>

                                {/* Project Name - CENTER & LARGER */}
                <div className="flex flex-col space-y-2 items-center">
                  <div
                    className="px-4 py-2 rounded-lg text-lg font-bold transition-all duration-200 group-hover:shadow-lg"
                    style={projectColorStyles}
                  >
                    {project.name}
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Project #{String(project.project_number).padStart(4, '0')}
                  </p>
                </div>
                
                {/* Invoice Amount */}
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {project.to_be_invoiced ? `${(project.to_be_invoiced / 1000).toFixed(0)}k` : (
                      <span className="text-muted-foreground italic">Not set</span>
                    )}
                  </span>
                </div>
                
                {/* Actions */}
                <div className="flex justify-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle menu click
                    }}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}