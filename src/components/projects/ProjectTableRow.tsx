import { TableCell, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { Project } from "@/types/projects";

interface ProjectTableRowProps {
  project: Project;
  colorStyle: React.HTMLAttributes<HTMLDivElement>;
}

export function ProjectTableRow({ project, colorStyle }: ProjectTableRowProps) {
  const navigate = useNavigate();

  return (
    <TableRow 
      className="hover:bg-zinc-800/50 whitespace-nowrap cursor-pointer"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
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