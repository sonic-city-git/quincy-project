import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Copy, Plus, Trash } from "lucide-react";

const MOCK_PROJECTS = [
  {
    name: "Sondre Justad",
    lastInvoiced: "28.06.24",
    owner: "Sondre Sandhaug",
    color: "bg-amber-700",
  },
  {
    name: "Briskeby",
    lastInvoiced: "28.06.24 - 29.09.24",
    owner: "Stian Sagholen",
    color: "bg-rose-800",
  },
  {
    name: "Highasakite",
    lastInvoiced: "28.06.24 - 29.09.24",
    owner: "Raymond Hellem",
    color: "bg-blue-700",
  },
];

export function ProjectList() {
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

      <div className="bg-zinc-900 rounded-md">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Last Invoiced</TableHead>
              <TableHead>Owner</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_PROJECTS.map((project) => (
              <TableRow key={project.name} className="hover:bg-zinc-800/50">
                <TableCell className="w-12">
                  <div className="w-4 h-4 rounded border border-zinc-700"></div>
                </TableCell>
                <TableCell>
                  <div className={`${project.color} text-white px-4 py-2 rounded`}>
                    {project.name}
                  </div>
                </TableCell>
                <TableCell className="text-zinc-300">{project.lastInvoiced}</TableCell>
                <TableCell>
                  <div className={`${project.color} text-white px-4 py-2 rounded`}>
                    {project.owner}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}