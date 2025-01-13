import { TableHead, TableRow } from "@/components/ui/table";

export function CrewTableHeader() {
  return (
    <TableRow>
      <TableHead className="w-[300px]">Name</TableHead>
      <TableHead className="w-[200px]">Roles</TableHead>
      <TableHead className="hidden md:table-cell w-[200px]">Email</TableHead>
      <TableHead className="hidden md:table-cell w-[100px]">Phone</TableHead>
    </TableRow>
  );
}