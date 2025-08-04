import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Project } from "@/types/projects";
import { getInitials } from "@/utils/stringUtils";
import { COMPONENT_CLASSES, cn } from "@/design-system";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { getSimplifiedProjectStatus, getInvoiceStatusStyles } from "@/utils/invoiceStatusColors";

interface OwnerSectionProps {
  owner: {
    name: string;
    avatar_url?: string;
    projects: Project[];
  };
}

// Simple project list item using design system
function ProjectListItem({ project }: { project: Project }) {
  const navigate = useNavigate();
  
  // Use invoice status based styling
  const getProjectColorStyles = (project: any) => {
    const statusKey = getSimplifiedProjectStatus(project);
    return getInvoiceStatusStyles(statusKey);
  };

  return (
    <div 
      className={cn("p-4 cursor-pointer", COMPONENT_CLASSES.table.row)}
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="px-3 py-1.5 rounded-md text-sm font-medium"
            style={getProjectColorStyles(project)}
          >
            {project.name}
          </div>
          {project.project_type && (
            <Badge variant="outline" className="text-xs">
              {project.project_type.name}
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          #{String(project.project_number).padStart(4, '0')}
        </div>
      </div>
    </div>
  );
}

export function OwnerSection({ owner }: OwnerSectionProps) {
  return (
    <div>
              <div className={cn("px-4 py-2 font-medium text-sm text-muted-foreground", COMPONENT_CLASSES.table.header)}>
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            {owner.avatar_url ? (
              <AvatarImage 
                src={owner.avatar_url} 
                alt={owner.name} 
                className="object-cover"
              />
            ) : (
                              <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                {getInitials(owner.name)}
              </AvatarFallback>
            )}
          </Avatar>
          <span>{owner.name}</span>
        </div>
      </div>
      {/* Project List */}
      <div className="divide-y divide-border">
        {owner.projects.map((project) => (
          <ProjectListItem key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}