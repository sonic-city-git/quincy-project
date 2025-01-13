import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function CrewTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[300px]">Name</TableHead>
        <TableHead className="w-[200px]">Roles</TableHead>
        <TableHead className="w-[100px] text-right">Email</TableHead>
        <TableHead className="w-[150px] text-right">Phone</TableHead>
        <TableHead>Folder</TableHead>
      </TableRow>
    </TableHeader>
  );
}