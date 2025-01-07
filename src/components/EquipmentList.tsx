import { useState, useCallback, useRef } from "react";
import { addDays, subDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Equipment } from "@/types/equipment";
import { EQUIPMENT_FOLDERS } from "@/data/equipmentFolders";
import { useDebounceResize } from "@/hooks/useDebounceResize";
import { isItemInFolder } from "@/utils/folderUtils";
import { AddEquipmentDialog } from "./equipment/AddEquipmentDialog";
import { EquipmentTimeline } from "./equipment/EquipmentTimeline";
import { EquipmentFolderSelect } from "./equipment/EquipmentFolderSelect";
import { EquipmentTable } from "./equipment/EquipmentTable";
import { EquipmentSelectionHeader } from "./equipment/EquipmentSelectionHeader";

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
  const [searchTerm, setSearchTerm] = useState("");
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

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = searchTerm === "" || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = !selectedFolder || isItemInFolder(item.folderId, selectedFolder);
    return matchesSearch && matchesFolder;
  });

  const selectedEquipment = equipment
    .filter(item => selectedItems.includes(item.id))
    .map(item => ({
      id: item.id,
      name: item.name
    }));

  return (
    <div className="space-y-6" ref={containerRef}>
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-4 flex-1">
          <EquipmentFolderSelect
            selectedFolder={selectedFolder}
            onFolderSelect={handleFolderSelect}
          />
        </div>
        <AddEquipmentDialog onAddEquipment={handleAddEquipment} />
      </div>

      <div className="bg-zinc-900 rounded-md">
        <EquipmentSelectionHeader
          selectedItems={selectedItems}
          equipment={equipment}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onEditEquipment={handleEditEquipment}
          onDeleteEquipment={handleDeleteEquipment}
        />

        <EquipmentTable
          equipment={filteredEquipment}
          selectedItems={selectedItems}
          onSelectAll={handleSelectAll}
          onItemSelect={handleItemSelect}
        />

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
