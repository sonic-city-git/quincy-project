import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProjectTableRow } from "./ProjectTableRow";
import { Project } from "@/types/projects";

interface ProjectTableProps {
  projects: Project[];
}

export function ProjectTable({ projects }: ProjectTableProps) {
  return (
    <Table>
      <TableHeader className="bg-zinc-900/50 border-b border-zinc-800">
        <TableRow>
          <TableHead className="w-24 whitespace-nowrap">Project #</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="w-[250px]">Owner ↓</TableHead>
          <TableHead>Last Invoiced</TableHead>
        </TableRow>
      </TableHeader>
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