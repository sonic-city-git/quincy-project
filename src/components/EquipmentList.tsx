import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { EquipmentTimeline } from "./equipment/EquipmentTimeline";
import { addDays, subDays } from "date-fns";
import { AddEquipmentDialog } from "./equipment/AddEquipmentDialog";
import { EditEquipmentDialog } from "./equipment/EditEquipmentDialog";
import { useToast } from "@/hooks/use-toast";

const MOCK_EQUIPMENT = [
  {
    code: "4U-AIR",
    name: "Peli Air with 4U",
    price: "60.80",
    value: "1,500.00",
    weight: "10.50",
    stock: 5,
    id: "904",
  },
  {
    code: "1xCAT6/230-10M",
    name: "XXX 1xCat6 + 230V 10m",
    price: "45.00",
    value: "800.00",
    weight: "2.30",
    stock: 12,
    id: "2404",
  },
  {
    code: "SCHUKO-3M",
    name: "Schuko 1-3m",
    price: "14.77",
    value: "1,200.00",
    weight: "0.50",
    stock: 8,
    id: "1024",
  },
];

export function EquipmentList() {
  const [equipment, setEquipment] = useState(MOCK_EQUIPMENT);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(new Date());
  const { toast } = useToast();

  const handleAddEquipment = (newEquipment: any) => {
    setEquipment(prev => [...prev, newEquipment]);
    toast({
      title: "Equipment added",
      description: "New equipment has been added successfully",
    });
  };

  const handleEditEquipment = (editedEquipment: any) => {
    setEquipment(prev => 
      prev.map(item => 
        item.id === editedEquipment.id ? editedEquipment : item
      )
    );
    setSelectedItems([]);
    toast({
      title: "Equipment updated",
      description: "Equipment has been updated successfully",
    });
  };

  const handleDeleteEquipment = () => {
    setEquipment(prev => prev.filter(item => !selectedItems.includes(item.id)));
    setSelectedItems([]);
    toast({
      title: "Equipment deleted",
      description: `${selectedItems.length} equipment item(s) have been removed`,
    });
  };

  const handleItemSelect = (id: string) => {
    setSelectedItems((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.length === equipment.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(equipment.map(item => item.id));
    }
  };

  const daysToShow = 14;

  const handlePreviousPeriod = () => {
    setStartDate(prev => subDays(prev, daysToShow));
  };

  const handleNextPeriod = () => {
    setStartDate(prev => addDays(prev, daysToShow));
  };

  const selectedEquipment = equipment
    .filter(item => selectedItems.includes(item.id))
    .map(item => ({
      id: item.id,
      name: item.name
    }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            All folders
          </Button>
        </div>
        <AddEquipmentDialog onAddEquipment={handleAddEquipment} />
      </div>

      <div className="bg-zinc-900 rounded-md">
        <div className="h-[48px] border-b border-zinc-800/50">
          <div className="h-full flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className={`text-sm text-zinc-400 transition-opacity duration-200 ${selectedItems.length === 0 ? 'opacity-0' : 'opacity-100'}`}>
                {selectedItems.length} items selected
              </span>
              {selectedItems.length === 1 && (
                <EditEquipmentDialog 
                  equipment={equipment.find(item => item.id === selectedItems[0])!}
                  onEditEquipment={handleEditEquipment}
                  onDeleteEquipment={handleDeleteEquipment}
                />
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
                  checked={selectedItems.length === equipment.length && equipment.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Weight (kg)</TableHead>
              <TableHead>Book value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipment.map((item) => (
              <TableRow key={item.id} className="hover:bg-zinc-800/50 border-b border-zinc-800/50">
                <TableCell className="w-12">
                  <Checkbox 
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={() => handleItemSelect(item.id)}
                  />
                </TableCell>
                <TableCell className="font-mono whitespace-nowrap overflow-hidden text-ellipsis">{item.code}</TableCell>
                <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">{item.name}</TableCell>
                <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">{item.stock}</TableCell>
                <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">{item.price}</TableCell>
                <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">{item.weight} kg</TableCell>
                <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">
                  {(parseFloat(item.value.replace(',', '')) * item.stock).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
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