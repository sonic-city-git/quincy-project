import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useCallback, useRef } from "react";
import { EquipmentTimeline } from "./equipment/EquipmentTimeline";
import { addDays, subDays } from "date-fns";
import { AddEquipmentDialog } from "./equipment/AddEquipmentDialog";
import { EditEquipmentDialog } from "./equipment/EditEquipmentDialog";
import { useToast } from "@/hooks/use-toast";
import { Equipment } from "@/types/equipment";
import { EQUIPMENT_FOLDERS } from "@/data/equipmentFolders";
import { useDebounceResize } from "@/hooks/useDebounceResize";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

const MOCK_EQUIPMENT: Equipment[] = [
  {
    code: "4U-AIR",
    name: "Peli Air with 4U",
    price: "60.80",
    value: "1,500.00",
    weight: "10.50",
    stock: 5,
    id: "904",
    folderId: "flightcases",
  },
  {
    code: "1xCAT6/230-10M",
    name: "XXX 1xCat6 + 230V 10m",
    price: "45.00",
    value: "800.00",
    weight: "2.30",
    stock: 12,
    id: "2404",
    folderId: "cat",
  },
  {
    code: "SCHUKO-3M",
    name: "Schuko 1-3m",
    price: "14.77",
    value: "1,200.00",
    weight: "0.50",
    stock: 8,
    id: "1024",
    folderId: "schuko",
  },
];

export function EquipmentList() {
  const [equipment, setEquipment] = useState<Equipment[]>(MOCK_EQUIPMENT);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(new Date());
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleResize = useCallback(() => {
    // This empty callback is enough to trigger the debounced resize handling
  }, []);

  const { observe, unobserve } = useDebounceResize(handleResize);

  const handleAddEquipment = (newEquipment: Equipment) => {
    setEquipment(prev => [...prev, newEquipment]);
    toast({
      title: "Equipment added",
      description: "New equipment has been added successfully",
    });
  };

  const handleEditEquipment = (editedEquipment: Equipment) => {
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
    if (selectedItems.length === filteredEquipment.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredEquipment.map(item => item.id));
    }
  };

  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolder(folderId);
    setSelectedItems([]);
  };

  const daysToShow = 14;

  const handlePreviousPeriod = () => {
    setStartDate(prev => subDays(prev, daysToShow));
  };

  const handleNextPeriod = () => {
    setStartDate(prev => addDays(prev, daysToShow));
  };

  const filteredEquipment = equipment.filter(item => 
    !selectedFolder || item.folderId === selectedFolder
  );

  const selectedEquipment = equipment
    .filter(item => selectedItems.includes(item.id))
    .map(item => ({
      id: item.id,
      name: item.name
    }));

  const renderFolderStructure = (folders: typeof EQUIPMENT_FOLDERS, level = 0) => {
    return folders.map(folder => (
      <div key={folder.id} style={{ marginLeft: `${level * 16}px` }}>
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={() => handleFolderSelect(folder.id)}
        >
          {folder.name}
        </DropdownMenuItem>
        {folder.subfolders && renderFolderStructure(folder.subfolders, level + 1)}
      </div>
    ));
  };

  return (
    <div className="space-y-6" ref={containerRef}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                {selectedFolder 
                  ? EQUIPMENT_FOLDERS.find(f => f.id === selectedFolder)?.name || 'All folders'
                  : 'All folders'}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={() => handleFolderSelect(null)}
              >
                All folders
              </DropdownMenuItem>
              {renderFolderStructure(EQUIPMENT_FOLDERS)}
            </DropdownMenuContent>
          </DropdownMenu>
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
                  checked={selectedItems.length === filteredEquipment.length && filteredEquipment.length > 0}
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
            {filteredEquipment.map((item) => (
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
          onMount={observe}
          onUnmount={unobserve}
        />
      </div>
    </div>
  );
}
