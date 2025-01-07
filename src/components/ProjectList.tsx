import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Copy, Plus, Trash } from "lucide-react";

const MOCK_PROJECTS = [
  {
    name: "Sondre Justad",
    lastInvoiced: "28.06.24",
    owner: "Sondre Sandhaug",
    color: "bg-amber-700",
    gigPrice: "15000 NOK",
    yearlyRevenue: "180000 NOK"
  },
  {
    name: "Briskeby",
    lastInvoiced: "28.06.24 - 29.09.24",
    owner: "Stian Sagholen",
    color: "bg-rose-800",
    gigPrice: "12000 NOK",
    yearlyRevenue: "144000 NOK"
  },
  {
    name: "Highasakite",
    lastInvoiced: "28.06.24 - 29.09.24",
    owner: "Raymond Hellem",
    color: "bg-blue-700",
    gigPrice: "18000 NOK",
    yearlyRevenue: "216000 NOK"
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
            {MOCK_PROJECTS.map((project) => (
              <TableRow key={project.name} className="hover:bg-zinc-800/50 whitespace-nowrap">
                <TableCell className="w-8">
                  <div className="w-4 h-4 rounded border border-zinc-700"></div>
                </TableCell>
                <TableCell className="pl-0">
                  <div className={`${project.color} text-white px-4 py-2 rounded truncate`}>
                    {project.name}
                  </div>
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