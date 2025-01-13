import { TableCell, TableRow } from "@/components/ui/table";
import { Project } from "@/types/projects";
import { formatDisplayDate } from "@/utils/dateFormatters";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const colorStyles = getColorStyles(project.color);

  return (
    <TableRow className="group hover:bg-zinc-800/50">
      <TableCell className="w-[100px] text-sm text-muted-foreground">
        {String(index).padStart(4, '0')}
      </TableCell>
      <TableCell className="w-[345px]">
        <div className="max-w-[345px]">
          <div 
            className="px-3.5 py-2 rounded-md text-[15px] font-medium truncate cursor-pointer"
            style={colorStyles}
            onClick={() => navigate(`/projects/${project.id}`)}
          >
            {project.name}
          </div>
        </div>
      </TableCell>
      <TableCell className="w-[300px] text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          {project.owner && (
            <Avatar className="h-6 w-6">
              {project.owner.avatar_url ? (
                <AvatarImage 
                  src={project.owner.avatar_url} 
                  alt={project.owner.name} 
                  className="object-cover"
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