import { TableHead, TableHeader as TableHeaderRoot, TableRow } from "@/components/ui/table";

export function TableHeader() {
  return (
    <TableHeaderRoot className="bg-zinc-900/50 border-b border-zinc-800">
      <TableRow>
        <TableHead className="w-24 whitespace-nowrap">Project #</TableHead>
        <TableHead>Name</TableHead>
        <TableHead>Owner</TableHead>
        <TableHead>Last Invoiced</TableHead>
      </TableRow>
    </TableHeaderRoot>
  );
}