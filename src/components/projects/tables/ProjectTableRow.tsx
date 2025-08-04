import { TableCell, TableRow } from "@/components/ui/table";
import { Project } from "@/types/projects";
import { formatDisplayDate } from "@/utils/dateFormatters";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/utils/stringUtils";
import { Badge } from "@/components/ui/badge";

interface ProjectTableRowProps {
  project: Project;
  index: number;
}

export function ProjectTableRow({ project, index }: ProjectTableRowProps) {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return formatDisplayDate(new Date(dateString));
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };

  const getColorStyles = (color: string) => {
    return {
      backgroundColor: `${color}80`,  // 80 in hex is 50% opacity
      color: '#FFFFFF'  // White text, fully opaque
    };
  };

  const colorStyles = getColorStyles(project.color);

  const isValidUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
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

  return (
    <TableRow className="group hover:bg-zinc-800/50">
      <TableCell className="w-[100px] text-sm text-muted-foreground">
        {String(index).padStart(4, '0')}
      </TableCell>
      <TableCell className="w-[345px]">
        <div className="max-w-[345px]">
          <div className="flex items-center gap-2">
            <div 
              className="px-3.5 py-2 rounded-md text-[15px] font-medium truncate cursor-pointer flex-1"
              style={colorStyles}
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              {project.name}
            </div>
            <Badge 
              variant={getProjectTypeBadgeVariant(project.project_type?.code)}
              className="whitespace-nowrap"
            >
              {project.project_type?.name || 'Artist'}
            </Badge>
          </div>
        </div>
      </TableCell>
      <TableCell className="w-[300px] text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          {project.owner && (
            <Avatar className="h-6 w-6">
              {isValidUrl(project.owner.avatar_url) ? (
                <AvatarImage 
                  src={project.owner.avatar_url}
                  alt={project.owner.name}
                  onError={(e) => {
                    console.error('Avatar image failed to load:', e);
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : (
                <AvatarFallback className="text-xs bg-zinc-800 text-zinc-400">
                  {getInitials(project.owner.name)}
                </AvatarFallback>
              )}
            </Avatar>
          )}
          <span>{project.owner?.name || 'No Owner'}</span>
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDate(project.created_at)}
      </TableCell>
    </TableRow>
  );
}