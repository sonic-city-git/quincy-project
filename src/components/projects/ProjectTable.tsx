import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProjectTableRow } from "./ProjectTableRow";
import { Project } from "@/types/projects";

interface ProjectTableProps {
  projects: Project[];
}

export function ProjectTable({ projects }: ProjectTableProps) {
  // Group projects by owner and sort owners alphabetically
  const groupedProjects = projects.reduce((groups, project) => {
    const ownerName = project.owner?.name || 'No Owner';
    if (!groups[ownerName]) {
      groups[ownerName] = [];
    }
    groups[ownerName].push(project);
    return groups;
  }, {} as Record<string, Project[]>);

  // Sort owner names alphabetically
  const sortedOwners = Object.keys(groupedProjects).sort((a, b) => a.localeCompare(b));

  return (
    <div className="relative">
      <div className="sticky top-0 z-20 bg-zinc-900 border-b border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24 whitespace-nowrap">Project #</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Last Invoiced</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      </div>
      <div className="divide-y divide-zinc-800">
        {sortedOwners.map((owner) => (
          <div key={owner}>
            <div className="bg-zinc-800/50 px-4 py-2 font-medium text-sm text-zinc-400">
              {owner}
            </div>
            <Table>
              <TableBody>
                {groupedProjects[owner].map((project) => (
                  <ProjectTableRow
                    key={project.id}
                    project={project}
                    index={project.project_number}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </div>
    </div>
  );
}