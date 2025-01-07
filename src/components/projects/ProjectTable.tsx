import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Project } from "@/types/projects";
import { ProjectTableRow } from "./ProjectTableRow";

const DEFAULT_COLORS = [
  '#9b87f5', // Primary Purple
  '#D946EF', // Magenta Pink
  '#F97316', // Bright Orange
  '#0EA5E9', // Ocean Blue
  '#8B5CF6', // Vivid Purple
];

interface ProjectTableProps {
  projects: Project[];
}

export function ProjectTable({ projects }: ProjectTableProps) {
  const getColorStyle = (color: string, index: number) => {
    if (color?.startsWith('bg-')) {
      const colorMap: { [key: string]: string } = {
        'bg-amber-700': '#B45309',
        'bg-rose-800': '#9F1239',
        'bg-blue-700': '#1D4ED8',
        'bg-green-700': '#15803D',
        'bg-purple-700': '#7E22CE',
      };
      return { style: { backgroundColor: colorMap[color] || DEFAULT_COLORS[index % DEFAULT_COLORS.length] } };
    }
    return { 
      style: { 
        backgroundColor: color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
      }
    };
  };

  return (
    <div className="bg-zinc-900 rounded-md overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent whitespace-nowrap">
            <TableHead className="pl-4">Project</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Last Invoiced</TableHead>
            <TableHead>Gig Price</TableHead>
            <TableHead>Yearly Revenue</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project, index) => (
            <ProjectTableRow 
              key={project.id}
              project={project}
              colorStyle={getColorStyle(project.color, index)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}