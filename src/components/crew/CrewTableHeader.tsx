import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function CrewTableHeader() {
  return (
    <TableHeader>
      <TableRow className="flex flex-col md:table-row">
        <TableHead className="w-[200px] max-w-[200px] h-10 flex items-center">Name</TableHead>
        <TableHead className="w-full md:w-[120px] h-10 flex items-center">Roles</TableHead>
        <TableHead className="w-[150px] hidden md:flex md:items-center">Email</TableHead>
        <TableHead className="w-[120px] hidden md:flex md:items-center">Phone</TableHead>
      </TableRow>
    </TableHeader>
  );
}