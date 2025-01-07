import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Copy, Plus, Trash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "@/hooks/useProjects";

const DEFAULT_COLORS = [
  '#9b87f5', // Primary Purple
  '#D946EF', // Magenta Pink
  '#F97316', // Bright Orange
  '#0EA5E9', // Ocean Blue
  '#8B5CF6', // Vivid Purple
];

export function ProjectList() {
  const navigate = useNavigate();
  const { projects, loading } = useProjects();

  const getColorStyle = (color: string, index: number) => {
    // If color starts with 'bg-', extract the actual color value
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
    // Otherwise use it as a direct color value, or fall back to default colors
    return { 
      style: { 
        backgroundColor: color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
      }
    };
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button variant="secondary" className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
        <Button variant="secondary" className="gap-2">
          <Copy className="h-4 w-4" />
          Duplicate Project
        </Button>
        <Button variant="secondary" className="gap-2">
          <Trash className="h-4 w-4" />
          Delete Project
        </Button>
      </div>

      <div className="bg-zinc-900 rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent whitespace-nowrap">
              <TableHead className="w-8"></TableHead>
              <TableHead className="pl-0">Project</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Last Invoiced</TableHead>
              <TableHead>Gig Price</TableHead>
              <TableHead>Yearly Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project, index) => (
              <TableRow 
                key={project.id} 
                className="hover:bg-zinc-800/50 whitespace-nowrap cursor-pointer"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <TableCell className="w-8">
                  <div 
                    className="w-3 h-3 rounded-full"
                    {...getColorStyle(project.color, index)}
                  />
                </TableCell>
                <TableCell className="pl-0">
                  <span className="text-white">
                    {project.name}
                  </span>
                </TableCell>
                <TableCell className="text-zinc-300">
                  {project.owner}
                </TableCell>
                <TableCell className="text-zinc-300">{project.lastInvoiced}</TableCell>
                <TableCell className="text-zinc-300">{project.gigPrice}</TableCell>
                <TableCell className="text-zinc-300">{project.yearlyRevenue}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}