import { Equipment } from "@/types/equipment";
import { AddEquipmentDialog } from "./AddEquipmentDialog";
import { EquipmentFolderSelect } from "./EquipmentFolderSelect";
import { EquipmentSearch } from "./EquipmentSearch";
import { Button } from "../ui/button";
import { Edit, Trash2 } from "lucide-react";
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

interface EquipmentHeaderProps {
  selectedFolder: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onAddEquipment: (equipment: Equipment) => void;
  onEditEquipment: (equipment: Equipment) => void;
  onDeleteEquipment: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedItems: string[];
  equipment: Equipment[];
}

export function EquipmentHeader({
  selectedFolder,
  onFolderSelect,
  onAddEquipment,
  onEditEquipment,
  onDeleteEquipment,
  searchTerm,
  onSearchChange,
  selectedItems,
  equipment,
}: EquipmentHeaderProps) {
  const selectedEquipment = equipment.find(item => selectedItems.includes(item.id));
  const hasSelection = selectedItems.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-4 flex-1">
          <EquipmentFolderSelect
            selectedFolder={selectedFolder}
            onFolderSelect={onFolderSelect}
          />
          <div className="w-[300px]">
            <EquipmentSearch
              searchTerm={searchTerm}
              onSearchChange={onSearchChange}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasSelection && selectedItems.length === 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => selectedEquipment && onEditEquipment(selectedEquipment)}
            >
              <Edit className="h-4 w-4" />
              EDIT
            </Button>
          )}
          {hasSelection && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2"
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
                  <AlertDialogAction onClick={onDeleteEquipment}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <AddEquipmentDialog onAddEquipment={onAddEquipment} />
        </div>
      </div>
    </div>
  );
}