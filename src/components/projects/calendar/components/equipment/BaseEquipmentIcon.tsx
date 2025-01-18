import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BaseEquipmentIconProps {
  isSynced: boolean;
  isDisabled?: boolean;
  onViewDifferences?: () => void;
  onSync: () => void;
  syncLabel?: string;
}

export function BaseEquipmentIcon({
  isSynced,
  isDisabled,
  onViewDifferences,
  onSync,
  syncLabel = "Sync equipment"
}: BaseEquipmentIconProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 p-0"
          disabled={isDisabled}
        >
          <Package className={isSynced ? "text-green-500" : "text-blue-500"} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {onViewDifferences && (
          <DropdownMenuItem onClick={onViewDifferences}>
            View differences
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onSync}>
          {syncLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}