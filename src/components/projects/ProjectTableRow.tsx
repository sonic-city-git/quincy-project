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

  return (
    <TableRow className="group hover:bg-zinc-800/50">
      <TableCell className="text-sm text-muted-foreground">
        {String(index).padStart(4, '0')}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-sm bg-${project.color}-500`} />
          <div 
            className={`px-2 py-1 rounded-md text-sm font-medium bg-${project.color}-500/10 text-${project.color}-500`}
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