import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function EquipmentTableHeader() {
  return (
    <TableHeader className="sticky top-0 bg-zinc-900/95 border-b border-zinc-800 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/75 z-10">
      <TableRow>
        <TableHead className="w-12"></TableHead>
        <TableHead className="w-[200px]">Name</TableHead>
        <TableHead className="w-[150px]">Code</TableHead>
        <TableHead className="w-[100px]">Stock</TableHead>
        <TableHead className="w-[150px]">Price</TableHead>
      </TableRow>
    </TableHeader>
  );
}