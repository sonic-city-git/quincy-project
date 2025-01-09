import { Equipment } from "@/types/equipment";
import { EquipmentTable } from "../table/EquipmentTable";
import { EquipmentTimeline } from "../timeline/EquipmentTimeline";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { AddEquipmentDialog } from "../dialogs/AddEquipmentDialog";
import { EditEquipmentDialog } from "../dialogs/EditEquipmentDialog";
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

interface EquipmentContentProps {
  filteredEquipment: Equipment[];
  selectedItems: string[];
  selectedEquipment: { id: string; name: string; }[];
  startDate: Date;
  daysToShow: number;
  onSelectAll: () => void;
  onItemSelect: (id: string) => void;
  onPreviousPeriod: () => void;
  onNextPeriod: () => void;
  observe: (element: Element | null) => void;
  unobserve: (element: Element | null) => void;
  onAddEquipment: (equipment: Equipment) => void;
  onEditEquipment: (equipment: Equipment) => void;
  onDeleteEquipment: () => void;
}

export function EquipmentContent({
  filteredEquipment,
  selectedItems,
  selectedEquipment,
  startDate,
  daysToShow,
  onSelectAll,
  onItemSelect,
  onPreviousPeriod,
  onNextPeriod,
  observe,
  unobserve,
  onAddEquipment,
  onEditEquipment,
  onDeleteEquipment,
}: EquipmentContentProps) {
  const hasSelection = selectedItems.length > 0;
  const singleSelectedEquipment = filteredEquipment.find(item => selectedItems.includes(item.id));

  return (
    <div className="flex-1 flex flex-col bg-zinc-900 rounded-md overflow-hidden">
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="text-sm text-zinc-400">
            {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex items-center gap-2">
            {hasSelection && selectedItems.length === 1 && singleSelectedEquipment && (
              <EditEquipmentDialog
                equipment={singleSelectedEquipment}
                onEditEquipment={onEditEquipment}
                onDeleteEquipment={onDeleteEquipment}
              />
            )}
            {hasSelection && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
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
                    <AlertDialogAction onClick={onDeleteEquipment}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button size="sm" className="h-8" onClick={() => document.getElementById('add-equipment-trigger')?.click()}>
              <Plus className="h-4 w-4 mr-2" />
              Add equipment
            </Button>
            <AddEquipmentDialog onAddEquipment={onAddEquipment} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <EquipmentTable
          equipment={filteredEquipment}
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
          onPreviousPeriod={onPreviousPeriod}
          onNextPeriod={onNextPeriod}
          onMount={observe}
          onUnmount={unobserve}
        />
      </div>
    </div>
  );
}