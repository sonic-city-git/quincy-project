import { Table, TableBody } from "@/components/ui/table";
import { ProjectTableRow } from "./ProjectTableRow";
import { Project } from "@/types/projects";

interface ProjectTableProps {
  projects: Project[];
}

export function ProjectTable({ projects }: ProjectTableProps) {
  return (
    <Table>
      <TableBody>
        {projects.map((project) => (
          <ProjectTableRow
            key={project.id}
            project={project}
            index={project.project_number}
          />
        ))}
      </TableBody>
    </Table>
  );
}