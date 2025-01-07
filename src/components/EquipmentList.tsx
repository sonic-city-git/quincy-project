import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Wrench } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { EquipmentTimeline } from "./equipment/EquipmentTimeline";
import { addDays, subDays } from "date-fns";

const MOCK_EQUIPMENT = [
  {
    code: "4U-AIR",
    name: "Peli Air with 4U",
    price: "60.80",
    value: "1,500.00",
    id: "904",
  },
  {
    code: "1xCAT6/230-10M",
    name: "XXX 1xCat6 + 230V 10m",
    price: "45.00",
    value: "800.00",
    id: "2404",
  },
  {
    code: "SCHUKO-3M",
    name: "Schuko 1-3m",
    price: "14.77",
    value: "1,200.00",
    id: "1024",
  },
];

export function EquipmentList() {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(new Date());

  const handleItemSelect = (id: string) => {
    setSelectedItems((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.length === MOCK_EQUIPMENT.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(MOCK_EQUIPMENT.map(item => item.id));
    }
  };

  const daysToShow = 14;

  const handlePreviousPeriod = () => {
    setStartDate(prev => subDays(prev, daysToShow));
  };

  const handleNextPeriod = () => {
    setStartDate(prev => addDays(prev, daysToShow));
  };

  const selectedEquipment = MOCK_EQUIPMENT
    .filter(equipment => selectedItems.includes(equipment.id))
    .map(equipment => ({
      id: equipment.id,
      name: equipment.name
    }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            All folders
          </Button>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add equipment
        </Button>
      </div>

      <div className="bg-zinc-900 rounded-md">
        <div className="h-[48px] border-b border-zinc-800/50">
          <div className="h-full flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className={`text-sm text-zinc-400 transition-opacity duration-200 ${selectedItems.length === 0 ? 'opacity-0' : 'opacity-100'}`}>
                {selectedItems.length} items selected
              </span>
              {selectedItems.length === 1 && (
                <Button variant="ghost" size="sm" className="gap-2">
                  <Wrench className="h-4 w-4" />
                  EDIT
                </Button>
              )}
            </div>
            <Button variant="ghost" size="sm" className={`transition-opacity duration-200 ${selectedItems.length === 0 ? 'opacity-0' : 'opacity-100'}`}>
              Adjust view
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-zinc-800/50">
              <TableHead className="w-12">
                <Checkbox 
                  checked={selectedItems.length === MOCK_EQUIPMENT.length && MOCK_EQUIPMENT.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Price (kr)</TableHead>
              <TableHead>Value (kr)</TableHead>
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
                <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">{equipment.price}</TableCell>
                <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">{equipment.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <EquipmentTimeline
          startDate={startDate}
          daysToShow={daysToShow}
          selectedEquipment={selectedEquipment}
          onPreviousPeriod={handlePreviousPeriod}
          onNextPeriod={handleNextPeriod}
        />
      </div>
    </div>
  );
}