import { TableCell, TableRow } from "@/components/ui/table";
import { Project } from "@/types/projects";
import { Checkbox } from "@/components/ui/checkbox";

interface ProjectTableRowProps {
  project: Project;
  index: number;
  colorStyle: React.HTMLAttributes<HTMLDivElement>;
  isSelected: boolean;
  onSelect: () => void;
}

export function ProjectTableRow({ project, index, colorStyle, isSelected, onSelect }: ProjectTableRowProps) {
  return (
    <TableRow 
      className={`group hover:bg-zinc-800/50 ${
        isSelected ? 'bg-zinc-800/75' : ''
      }`}
    >
      <TableCell className="w-12">
        <Checkbox 
          checked={isSelected}
          onCheckedChange={onSelect}
        />
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {index}
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
      <TableCell className="text-sm text-muted-foreground">
        {project.status}
      </TableCell>
    </TableRow>
  );
}