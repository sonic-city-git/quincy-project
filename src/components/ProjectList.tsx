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
    // If color starts with 'bg-', it's a Tailwind class
    if (color?.startsWith('bg-')) {
      return { className: color };
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
                  <div className="w-4 h-4 rounded border border-zinc-700"></div>
                </TableCell>
                <TableCell className="pl-0">
                  <span 
                    {...getColorStyle(project.color, index)}
                    className={`inline-block px-3 py-1 rounded font-medium text-white ${
                      project.color?.startsWith('bg-') ? project.color : ''
                    }`}
                    style={{ 
                      minWidth: '120px',
                      ...(getColorStyle(project.color, index).style || {})
                    }}
                  >
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
