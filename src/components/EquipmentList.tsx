import { useState, useCallback, useRef, useMemo } from "react";
import { addDays, subDays } from "date-fns";
import { useDebounceResize } from "@/hooks/useDebounceResize";
import { Equipment } from "@/types/equipment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Trash2, Pen } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EquipmentTable } from "./equipment/EquipmentTable";
import { EquipmentTimeline } from "./equipment/EquipmentTimeline";
import { AddEquipmentDialog } from "./equipment/AddEquipmentDialog";
import { EditEquipmentDialog } from "./equipment/EditEquipmentDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

  const selectedEquipment = useMemo(() => {
    return equipment
      .filter(item => selectedItems.includes(item.id))
      .map(item => ({
        id: item.id,
        name: item.name
      }));
  }, [equipment, selectedItems]);

  const hasSelection = selectedItems.length > 0;
  const singleSelectedEquipment = equipment.find(item => selectedItems.includes(item.id));

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))]" ref={containerRef}>
      <div className="space-y-4">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
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
                {/* Add folder items here */}
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
          <div className="flex items-center gap-2">
            {hasSelection && selectedItems.length === 1 && singleSelectedEquipment && (
              <Button variant="ghost" size="sm" className="gap-2 h-9" onClick={() => document.getElementById('edit-equipment-trigger')?.click()}>
                <Pen className="h-4 w-4" />
                EDIT
              </Button>
            )}
            {hasSelection && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2 h-9"
                  >
                    <Trash2 className="h-4 w-4" />
                    DELETE
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteEquipment}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button size="sm" className="gap-2 h-9" onClick={() => document.getElementById('add-equipment-trigger')?.click()}>
              <Plus className="h-4 w-4" />
              Add equipment
            </Button>
            <AddEquipmentDialog onAddEquipment={onAddEquipment} />
            {selectedItems.length === 1 && singleSelectedEquipment && (
              <EditEquipmentDialog
                equipment={singleSelectedEquipment}
                onEditEquipment={onEditEquipment}
                onDeleteEquipment={handleDeleteEquipment}
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-zinc-900 rounded-md mt-4 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <EquipmentTable
            equipment={equipment}
            selectedItems={selectedItems}
            onSelectAll={onSelectAll}
            onItemSelect={onItemSelect}
          />
        </div>

        <div className="flex-shrink-0">
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
    </div>
  );
}