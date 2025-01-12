import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function EquipmentTableHeader() {
  return (
    <TableHeader className="sticky top-0 bg-zinc-900/95 border-b border-zinc-800 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/75 z-10">
      <TableRow>
        <TableHead className="w-[48px] sticky left-0 bg-zinc-900/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/75 z-20"></TableHead>
        <TableHead className="w-[300px] sticky left-[48px] bg-zinc-900/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/75 z-20">Name</TableHead>
        <TableHead className="w-[200px] sticky left-[348px] bg-zinc-900/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/75 z-20">Code</TableHead>
        <TableHead className="w-[100px] text-right">Stock</TableHead>
        <TableHead className="w-[150px] text-right">Price</TableHead>
      </TableRow>
    </TableHeader>
  );
}