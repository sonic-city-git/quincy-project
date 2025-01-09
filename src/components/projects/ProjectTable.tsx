import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProjectTableRow } from "./ProjectTableRow";
import { Project } from "@/types/projects";

interface ProjectTableProps {
  projects: Project[];
  selectedItem: string | null;
  onItemSelect: (id: string) => void;
}

export function ProjectTable({ projects, selectedItem, onItemSelect }: ProjectTableProps) {
  return (
    <Table>
      <TableHeader className="bg-zinc-900/50 border-b border-zinc-800">
        <TableRow>
          <TableHead className="w-12"></TableHead>
          <TableHead className="w-12">#</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Last Invoiced</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project, index) => (
          <ProjectTableRow
            key={project.id}
            project={project}
            index={index + 1}
            colorStyle={{
              className: `bg-${project.color}-500/10 text-${project.color}-500`
            }}
            isSelected={selectedItem === project.id}
            onSelect={() => onItemSelect(project.id)}
          />
        ))}
      </TableBody>
    </Table>
  );
}