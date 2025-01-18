import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EquipmentSyncMenuProps {
  isEditingDisabled: boolean;
  isChecking: boolean;
  isSynced: boolean;
  onViewDifferences: () => void;
  onSync: () => void;
}

export function EquipmentSyncMenu({
  isEditingDisabled,
  isChecking,
  isSynced,
  onViewDifferences,
  onSync,
}: EquipmentSyncMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 p-0"
          disabled={isEditingDisabled || isChecking}
        >
          <Package className="text-blue-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={onViewDifferences}>
          View differences
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSync}>
          Sync equipment
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}