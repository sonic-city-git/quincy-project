import { TableCell, TableRow } from "@/components/ui/table";
import { Project } from "@/types/projects";
import { format, parseISO } from "date-fns";

interface ProjectTableRowProps {
  project: Project;
  index: number;
}

export function ProjectTableRow({ project, index }: ProjectTableRowProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return format(parseISO(dateString), 'dd.MM.yy');
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

  return (
    <TableRow className="group hover:bg-zinc-800/50">
      <TableCell className="text-sm">
        <div className="flex items-center space-x-2">
          <div 
            className="px-2 py-1 rounded-md text-sm font-medium flex items-center space-x-2"
            style={colorStyles}
          >
            <span>{String(index).padStart(4, '0')}</span>
            <span className="mx-2">·</span>
            <span className="truncate">{project.name}</span>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {project.owner}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDate(project.lastInvoiced)}
      </TableCell>
    </TableRow>
  );
}