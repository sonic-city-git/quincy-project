import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProjectTableRow } from "./ProjectTableRow";
import { Project } from "@/types/projects";

interface ProjectTableProps {
  projects: Project[];
}

export function ProjectTable({ projects }: ProjectTableProps) {
  // Group projects by owner
  const groupedProjects = projects.reduce((groups, project) => {
    const ownerName = project.owner?.name || 'No Owner';
    if (!groups[ownerName]) {
      groups[ownerName] = [];
    }
    groups[ownerName].push(project);
    return groups;
  }, {} as Record<string, Project[]>);

  return (
    <Table>
      <TableHeader className="bg-zinc-900/50 border-b border-zinc-800">
        <TableRow>
          <TableHead className="w-24 whitespace-nowrap">Project #</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="w-[250px]">Owner</TableHead>
          <TableHead>Last Invoiced</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Object.entries(groupedProjects).map(([owner, ownerProjects]) => (
          <div key={owner}>
            <TableRow className="bg-zinc-800/50">
              <TableHead colSpan={4} className="h-8 text-sm font-medium text-muted-foreground">
                {owner}
              </TableHead>
            </TableRow>
            {ownerProjects.map((project) => (
              <ProjectTableRow
                key={project.id}
                project={project}
                index={project.project_number}
              />
            ))}
          </div>
        ))}
      </TableBody>
    </Table>
  );
}