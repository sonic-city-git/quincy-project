/**
 * IMPROVED PROJECT LIST CONTENT
 * 
 * Uses standardized components and follows dashboard design patterns
 * Demonstrates the design system improvements
 */

import { useNavigate } from "react-router-dom";
import { Calendar, Building, User } from "lucide-react";
import { StandardizedTable, ColumnDefinition } from "@/components/shared/StandardizedTable";
import { StandardizedCard, StandardizedCardGrid } from "@/components/shared/StandardizedCard";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Project } from "@/types/projects";
import { BaseTableProps, OwnerFilters } from "@/types/ui-common";
import { formatDate } from "@/utils/dateFormatters";
import { getInitials } from "@/utils/stringUtils";

interface ProjectListContentImprovedProps extends BaseTableProps<Project, OwnerFilters> {
  groupedProjects: Record<string, { 
    name: string; 
    avatar_url?: string;
    projects: Project[] 
  }>;
  viewMode?: 'table' | 'cards';
}

// Utility function for project colors
function getProjectColorStyles(color: string | null | undefined) {
  if (!color) {
    return {
      backgroundColor: '#64748b', // slate-500
      color: '#FFFFFF',
      border: '1px solid #475569'
    };
  }
  
  return {
    backgroundColor: color,
    color: '#FFFFFF',
    border: `1px solid ${color}`,
    boxShadow: `0 0 0 1px ${color}20`
  };
}

// Utility function for project type badge variant
function getProjectTypeBadgeVariant(typeCode: string | undefined): "default" | "secondary" | "destructive" | "outline" {
  switch (typeCode) {
    case 'TV':
      return 'default';
    case 'FESTIVAL':
      return 'secondary';
    case 'TOURING':
      return 'outline';
    default:
      return 'default';
  }
}

// Table column definitions following standardized pattern
const projectColumns: ColumnDefinition[] = [
  {
    key: 'project_number',
    label: 'Project #',
    width: 'w-[100px]',
    align: 'left',
    render: (value: number) => (
      <span className="text-sm text-muted-foreground">
        {String(value).padStart(4, '0')}
      </span>
    )
  },
  {
    key: 'name',
    label: 'Name',
    width: 'w-[345px]',
    sortable: true,
    render: (value: string, project: any) => (
      <div className="max-w-[345px]">
        <div className="flex items-center gap-2">
          <div 
            className="px-3.5 py-2 rounded-md text-[15px] font-medium truncate flex-1"
            style={getProjectColorStyles(project.color)}
          >
            {value}
          </div>
          <Badge 
            variant={getProjectTypeBadgeVariant(project.project_type?.code)}
            className="whitespace-nowrap"
          >
            {project.project_type?.name || 'Artist'}
          </Badge>
        </div>
      </div>
    )
  },
  {
    key: 'owner',
    label: 'Owner',
    width: 'w-[300px]',
    sortable: true,
    render: (owner: any) => (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {owner && (
          <>
            <Avatar className="h-6 w-6">
              {owner.avatar_url ? (
                <AvatarImage 
                  src={owner.avatar_url}
                  alt={owner.name}
                />
              ) : (
                <AvatarFallback className="text-xs bg-zinc-800 text-zinc-400">
                  {getInitials(owner.name)}
                </AvatarFallback>
              )}
            </Avatar>
            <span>{owner.name}</span>
          </>
        )}
        {!owner && <span>No Owner</span>}
      </div>
    )
  },
  {
    key: 'created_at',
    label: 'Created',
    sortable: true,
    render: (value: string) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(value)}
      </span>
    )
  }
];

export function ProjectListContentImproved({ 
  loading, 
  groupedProjects,
  viewMode = 'table',
  onItemClick,
  emptyMessage = "No projects found"
}: ProjectListContentImprovedProps) {
  const navigate = useNavigate();

  // Flatten projects for table view
  const allProjects = Object.values(groupedProjects).flatMap(owner => 
    owner.projects.map(project => ({
      ...project,
      owner: { name: owner.name, avatar_url: owner.avatar_url }
    }))
  );

  const handleProjectClick = (project: Project) => {
    navigate(`/projects/${project.id}`);
    onItemClick?.(project);
  };

  // Card view rendering
  if (viewMode === 'cards') {
    if (loading) {
      return (
        <StandardizedCardGrid variant="default">
          {Array.from({ length: 6 }).map((_, i) => (
            <StandardizedCard
              key={i}
              loading={true}
              variant="list"
            >
              <div></div>
            </StandardizedCard>
          ))}
        </StandardizedCardGrid>
      );
    }

    if (!groupedProjects || Object.keys(groupedProjects).length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {Object.values(groupedProjects).map((owner) => (
          <div key={owner.name} className="space-y-3">
            {/* Owner Section Header */}
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Building className="h-4 w-4" />
              <span>{owner.name}</span>
              <Badge variant="outline" className="text-xs">
                {owner.projects.length} projects
              </Badge>
            </div>
            
            {/* Project Cards */}
            <StandardizedCardGrid variant="default">
              {owner.projects.map((project) => (
                <StandardizedCard
                  key={project.id}
                  title={project.name}
                  subtitle={project.project_type?.name || 'Artist'}
                  icon={Calendar}
                  variant="list"
                  status="operational"
                  onClick={() => handleProjectClick(project)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{owner.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Created {formatDate(project.created_at)}
                    </div>
                  </div>
                </StandardizedCard>
              ))}
            </StandardizedCardGrid>
          </div>
        ))}
      </div>
    );
  }

  // Table view using standardized table
  return (
    <StandardizedTable
      data={allProjects}
      columns={projectColumns}
      loading={loading}
      variant="bordered"
      emptyMessage={emptyMessage}
      onRowClick={handleProjectClick}
    />
  );
}