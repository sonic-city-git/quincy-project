import { TableCell, TableRow } from "@/components/ui/table";
import { Project } from "@/types/projects";

interface ProjectTableRowProps {
  project: Project;
  index: number;
  colorStyle: React.HTMLAttributes<HTMLDivElement>;
}

export function ProjectTableRow({ project, index, colorStyle }: ProjectTableRowProps) {
  return (
    <TableRow className="group hover:bg-zinc-800/50">
      <TableCell className="text-sm text-muted-foreground">
        {String(index).padStart(4, '0')}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div 
            className={`px-2 py-1 rounded-md text-sm font-medium ${colorStyle.className}`}
          >
            {project.name}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {project.owner}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {project.lastInvoiced || '-'}
      </TableCell>
    </TableRow>
  );
}