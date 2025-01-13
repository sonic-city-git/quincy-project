import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function CrewTableHeader() {
  return (
    <TableHeader>
      <TableRow className="flex md:table-row">
        <TableHead className="w-[200px] min-w-[200px] h-10 flex items-center">Name</TableHead>
        <TableHead className="w-[120px] min-w-[120px] h-10 flex items-center">Roles</TableHead>
        <TableHead className="w-[150px] min-w-[150px] h-10 hidden md:flex items-center">Email</TableHead>
        <TableHead className="w-[120px] min-w-[120px] h-10 hidden md:flex items-center">Phone</TableHead>
      </TableRow>
    </TableHeader>
  );
}