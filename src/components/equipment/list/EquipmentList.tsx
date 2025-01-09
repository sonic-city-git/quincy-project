import { useState, useCallback, useRef } from "react";
import { Equipment } from "@/types/equipment";
import { useDebounceResize } from "@/hooks/useDebounceResize";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EquipmentContent } from "./EquipmentContent";

interface EquipmentListProps {
  equipment: Equipment[];
  selectedItems: string[];
  selectedFolder: string | null;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onFolderSelect: (folderId: string | null) => void;
  onAddEquipment: (equipment: Equipment) => void;
  onEditEquipment: (equipment: Equipment) => void;
  onDeleteEquipment: (ids: string[]) => void;
  onItemSelect: (id: string) => void;
  onSelectAll: () => void;
}

export function EquipmentList({
  equipment,
  selectedItems,
  selectedFolder,
  searchTerm,
  onSearchChange,
  onFolderSelect,
  onAddEquipment,
  onEditEquipment,
  onDeleteEquipment,
  onItemSelect,
  onSelectAll,
}: EquipmentListProps) {
  const [startDate, setStartDate] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);
  const daysToShow = 14;

  const handleResize = useCallback(() => {
    // Empty callback is enough to trigger the debounced resize handling
  }, []);

  const { observe, unobserve } = useDebounceResize(handleResize);

  const handlePreviousPeriod = useCallback(() => {
    setStartDate(prev => subDays(prev, daysToShow));
  }, [daysToShow]);

  const handleNextPeriod = useCallback(() => {
    setStartDate(prev => addDays(prev, daysToShow));
  }, [daysToShow]);

  const handleDeleteEquipment = useCallback(() => {
    onDeleteEquipment(selectedItems);
  }, [onDeleteEquipment, selectedItems]);

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))]" ref={containerRef}>
      <div className="flex items-center gap-4 mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant={selectedFolder ? "default" : "outline"} 
              size="icon"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            <DropdownMenuCheckboxItem
              checked={!selectedFolder}
              onCheckedChange={() => onFolderSelect(null)}
            >
              All folders
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="w-[300px]">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search equipment..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>
      </div>

      <EquipmentContent
        filteredEquipment={equipment}
        selectedItems={selectedItems}
        selectedEquipment={equipment
          .filter(item => selectedItems.includes(item.id))
          .map(item => ({
            id: item.id,
            name: item.name
          }))}
        startDate={startDate}
        daysToShow={daysToShow}
        onSelectAll={onSelectAll}
        onItemSelect={onItemSelect}
        onPreviousPeriod={handlePreviousPeriod}
        onNextPeriod={handleNextPeriod}
        observe={observe}
        unobserve={unobserve}
        onAddEquipment={onAddEquipment}
        onEditEquipment={onEditEquipment}
        onDeleteEquipment={handleDeleteEquipment}
      />
    </div>
  );
}