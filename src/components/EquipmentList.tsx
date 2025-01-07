import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Package } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

const MOCK_EQUIPMENT = [
  {
    code: "4U-AIR",
    name: "Peli Air with 4U",
    rentalPrice: "60.80",
    bookValue: "0.00",
    id: "904",
    type: "Rental",
    weight: "10.50",
  },
  {
    code: "1xCAT6/230-10M",
    name: "XXX 1xCat6 + 230V 10m",
    rentalPrice: "0.00",
    bookValue: "0.00",
    id: "2404",
    type: "Rental",
    weight: "0.00",
  },
  {
    code: "SCHUKO-3M",
    name: "Schuko 1-3m",
    rentalPrice: "14.77",
    bookValue: "1,200.00",
    id: "1024",
    type: "Rental",
    weight: "0.50",
  },
];

export function EquipmentList() {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleItemSelect = (id: string) => {
    setSelectedItems((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            All folders
          </Button>
          <Button variant="ghost" size="sm">
            All
          </Button>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add equipment
        </Button>
      </div>

      <div className="bg-zinc-900 rounded-md">
        {selectedItems.length > 0 && (
          <div className="p-2 border-b border-zinc-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">{selectedItems.length} items selected</span>
              <Button variant="ghost" size="sm" className="gap-2">
                <Package className="h-4 w-4" />
                EDIT
              </Button>
            </div>
            <Button variant="ghost" size="sm">
              Adjust view
            </Button>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-zinc-800/50">
              <TableHead className="w-12">
                <Checkbox />
              </TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Name (in database)</TableHead>
              <TableHead>Rental-/Sales price</TableHead>
              <TableHead>Book value</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Rental/sales</TableHead>
              <TableHead>Weight</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_EQUIPMENT.map((equipment) => (
              <TableRow key={equipment.id} className="hover:bg-zinc-800/50 border-b border-zinc-800/50">
                <TableCell className="w-12">
                  <Checkbox 
                    checked={selectedItems.includes(equipment.id)}
                    onCheckedChange={() => handleItemSelect(equipment.id)}
                  />
                </TableCell>
                <TableCell className="font-mono whitespace-nowrap overflow-hidden text-ellipsis">{equipment.code}</TableCell>
                <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">{equipment.name}</TableCell>
                <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">kr {equipment.rentalPrice}</TableCell>
                <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">kr {equipment.bookValue}</TableCell>
                <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">{equipment.id}</TableCell>
                <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">{equipment.type}</TableCell>
                <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">{equipment.weight} kg</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}