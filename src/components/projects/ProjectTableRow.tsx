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
    // Prevent navigation when clicking the checkbox
    if ((e.target as HTMLElement).closest('[role="checkbox"]')) {
      return;
    }
    navigate(`/projects/${project.id}`);
  };

  return (
    <TableRow 
      className="hover:bg-zinc-800/50 whitespace-nowrap cursor-pointer"
      onClick={handleClick}
    >
      <TableCell className="w-12">
        <Checkbox 
          checked={isSelected}
          onCheckedChange={onSelect}
        />
      </TableCell>
      <TableCell className="pl-4">
        <div 
          className="inline-block px-3 py-1 rounded"
          {...colorStyle}
        >
          <span className="text-white font-medium">
            {project.name}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-zinc-300">
        {project.owner}
      </TableCell>
      <TableCell className="text-zinc-300">{project.lastInvoiced}</TableCell>
      <TableCell className="text-zinc-300">{project.gigPrice}</TableCell>
      <TableCell className="text-zinc-300">{project.yearlyRevenue}</TableCell>
    </TableRow>
  );
}