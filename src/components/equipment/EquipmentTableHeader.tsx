import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function EquipmentTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[300px]">Name</TableHead>
        <TableHead className="w-[200px]">Code</TableHead>
        <TableHead className="w-[100px] text-right">Stock</TableHead>
        <TableHead className="w-[150px] text-right">Rental Price</TableHead>
      </TableRow>
    </TableHeader>
  );
}