import { TableCell, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { Project } from "@/types/projects";
import { Checkbox } from "@/components/ui/checkbox";

interface ProjectTableRowProps {
  project: Project;
  colorStyle: React.HTMLAttributes<HTMLDivElement>;
  isSelected: boolean;
  onSelect: () => void;
}

export function ProjectTableRow({ project, colorStyle, isSelected, onSelect }: ProjectTableRowProps) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[role="checkbox"]')) {
      return;
    }
    navigate(`/projects/${project.id}`);
  };

  return (
    <TableRow 
      className={`group hover:bg-zinc-800/50 cursor-pointer transition-colors ${
        isSelected ? 'bg-zinc-800/75' : ''
      }`}
      onClick={handleClick}
    >
      <TableCell className="w-12">
        <Checkbox 
          checked={isSelected}
          onCheckedChange={onSelect}
        />
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
        {project.gigPrice || '-'}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {project.yearlyRevenue || '-'}
      </TableCell>
    </TableRow>
  );
}