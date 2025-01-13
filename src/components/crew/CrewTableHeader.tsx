import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function CrewTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[25%] min-w-[200px]">Name</TableHead>
        <TableHead className="w-[25%] min-w-[150px]">Roles</TableHead>
        <TableHead className="w-[20%] min-w-[150px]">Email</TableHead>
        <TableHead className="w-[15%] min-w-[120px]">Phone</TableHead>
        <TableHead className="w-[15%] min-w-[120px]">Folder</TableHead>
      </TableRow>
    </TableHeader>
  );
}