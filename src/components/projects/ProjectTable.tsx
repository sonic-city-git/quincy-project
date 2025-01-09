import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProjectTableRow } from "./ProjectTableRow";
import { Project } from "@/types/projects";

interface ProjectTableProps {
  projects: Project[];
  selectedItem: string | null;
  onItemSelect: (id: string) => void;
}

export function ProjectTable({ projects, selectedItem, onItemSelect }: ProjectTableProps) {
  const getColorStyle = (color: string) => ({
    className: color
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Last Invoiced</TableHead>
            <TableHead>Gig Price</TableHead>
            <TableHead>Yearly Revenue</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <ProjectTableRow
              key={project.id}
              project={project}
              colorStyle={getColorStyle(project.color)}
              isSelected={selectedItem === project.id}
              onSelect={() => onItemSelect(project.id)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}