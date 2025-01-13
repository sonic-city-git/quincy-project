import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function EquipmentTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[200px] lg:w-[300px]">Name</TableHead>
        <TableHead className="w-[150px] min-w-[150px] lg:w-[200px]">Code</TableHead>
        <TableHead className="w-[80px] min-w-[80px] lg:w-[100px] text-right">Stock</TableHead>
        <TableHead className="w-[120px] min-w-[120px] lg:w-[150px] text-right">Rental Price</TableHead>
      </TableRow>
    </TableHeader>
  );
}