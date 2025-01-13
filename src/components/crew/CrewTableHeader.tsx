import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function CrewTableHeader() {
  return (
    <TableHeader>
      <TableRow className="flex flex-col md:table-row">
        <TableHead className="w-full md:w-[300px]">Name</TableHead>
        <TableHead className="w-full md:w-[120px]">Roles</TableHead>
        <TableHead className="w-[150px] hidden md:table-cell">Email</TableHead>
        <TableHead className="w-[120px] hidden md:table-cell">Phone</TableHead>
      </TableRow>
    </TableHeader>
  );
}