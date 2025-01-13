import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function CrewTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[200px]">Name</TableHead>
        <TableHead className="w-[200px]">Roles</TableHead>
        <TableHead className="w-[250px]">Email</TableHead>
        <TableHead className="w-[150px]">Phone</TableHead>
        <TableHead>Folder</TableHead>
      </TableRow>
    </TableHeader>
  );
}