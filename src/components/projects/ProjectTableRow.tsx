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

  const getColorClasses = (color: string) => {
    return {
      bg: `bg-${color}-500/10`,
      text: `text-${color}-500`
    };
  };

  const colors = getColorClasses(project.color);

  return (
    <TableRow className="group hover:bg-zinc-800/50">
      <TableCell className="text-sm text-muted-foreground">
        {String(index).padStart(4, '0')}
      </TableCell>
      <TableCell>
        <div className="max-w-[300px]">
          <div 
            className={`px-2 py-1 rounded-md text-sm font-medium ${colors.bg} ${colors.text} truncate`}
          >
            {project.name}
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