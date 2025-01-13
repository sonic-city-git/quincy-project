import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function EquipmentTableHeader() {
  return (
    <TableHeader>
      <TableRow className="flex flex-col md:table-row">
        <TableHead className="w-full md:w-[300px]">Name</TableHead>
        <TableHead className="w-full md:w-[200px]">Code</TableHead>
        <TableHead className="w-[100px] text-right hidden md:table-cell">Stock</TableHead>
        <TableHead className="w-[150px] text-right hidden md:table-cell">Rental Price</TableHead>
      </TableRow>
    </TableHeader>
  );
}