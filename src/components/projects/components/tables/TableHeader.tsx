import { TableHead, TableHeader as TableHeaderRoot, TableRow } from "@/components/ui/table";
import { COMPONENT_CLASSES, cn } from "@/design-system";

export function TableHeader() {
  return (
    <TableHeaderRoot className={cn(COMPONENT_CLASSES.table.header)}>
      <TableRow>
        <TableHead className="w-[100px]">Project #</TableHead>
        <TableHead className="w-[345px]">Name</TableHead>
        <TableHead className="w-[300px]">Owner</TableHead>
        <TableHead>Last Invoiced</TableHead>
      </TableRow>
    </TableHeaderRoot>
  );
}