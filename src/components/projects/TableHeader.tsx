import { TableHead, TableHeader as TableHeaderRoot, TableRow } from "@/components/ui/table";

export function TableHeader() {
  return (
    <TableHeaderRoot className="bg-zinc-900/50 border-b border-zinc-800">
      <TableRow>
        <TableHead className="w-[100px]">Project #</TableHead>
        <TableHead className="w-[345px]">Name</TableHead>
        <TableHead className="w-[300px]">Owner</TableHead>
        <TableHead>Last Invoiced</TableHead>
      </TableRow>
    </TableHeaderRoot>
  );
}