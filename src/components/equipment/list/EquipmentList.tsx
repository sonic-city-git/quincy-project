import { useState, useCallback } from "react";
import { Equipment } from "@/types/equipment";
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
import { addDays, subDays } from "date-fns";

interface EquipmentListProps {
  equipment: Equipment[];
  selectedItems: string[];
  selectedEquipment: { id: string; name: string; }[];
  selectedFolder: string | null;
  searchTerm: string;
  startDate: Date;
  onSearchChange: (value: string) => void;
  onFolderSelect: (folderId: string | null) => void;
  onAddEquipment: (equipment: Equipment) => void;
  onEditEquipment: (equipment: Equipment) => void;
  onDeleteEquipment: () => void;
  onItemSelect: (id: string) => void;
  onSelectAll: () => void;
  onPreviousPeriod: () => void;
  onNextPeriod: () => void;
}

export function EquipmentList({
  equipment,
  selectedItems,
  selectedEquipment,
  selectedFolder,
  searchTerm,
  startDate,
  onSearchChange,
  onFolderSelect,
  onAddEquipment,
  onEditEquipment,
  onDeleteEquipment,
  onItemSelect,
  onSelectAll,
  onPreviousPeriod,
  onNextPeriod,
}: EquipmentListProps) {
  const daysToShow = 14;

  return (
    <div className="h-[calc(100vh-6rem)]">
      <div className="bg-zinc-900 rounded-md flex flex-col h-full border border-zinc-800/50">
        <div className="p-4 border-b border-zinc-800/50">
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant={selectedFolder ? "default" : "outline"} 
                  size="icon"
                  className="h-9 w-9"
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
            <div className="flex items-center gap-2 ml-auto">
              {selectedItems.length === 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => onEditEquipment(equipment.find(e => e.id === selectedItems[0])!)}
                >
                  Edit
                </Button>
              )}
              <Button size="sm" className="gap-2 h-9" onClick={() => document.getElementById('add-equipment-trigger')?.click()}>
                <Plus className="h-4 w-4" />
                Add equipment
              </Button>
            </div>
          </div>
        </div>

        <EquipmentContent
          filteredEquipment={equipment}
          selectedItems={selectedItems}
          selectedEquipment={selectedEquipment}
          startDate={startDate}
          daysToShow={daysToShow}
          onSelectAll={onSelectAll}
          onItemSelect={onItemSelect}
          onPreviousPeriod={onPreviousPeriod}
          onNextPeriod={onNextPeriod}
          onAddEquipment={onAddEquipment}
          onEditEquipment={onEditEquipment}
          onDeleteEquipment={onDeleteEquipment}
        />
      </div>
    </div>
  );
}