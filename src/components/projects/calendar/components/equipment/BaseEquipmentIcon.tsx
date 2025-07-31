import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BaseEquipmentIconProps {
  isSynced: boolean;
  isDisabled?: boolean;
  onViewDifferences?: () => void;
  onSync: () => void;
  syncLabel?: string;
  isUnsynced?: boolean;
  hasProjectEquipment?: boolean;
}

export function BaseEquipmentIcon({
  isSynced,
  isDisabled,
  onViewDifferences,
  onSync,
  syncLabel = "Sync equipment",
  isUnsynced = false,
  hasProjectEquipment = false
}: BaseEquipmentIconProps) {
  // If no project equipment, don't show anything
  if (!hasProjectEquipment) {
    return null;
  }

  // If synced, just show the green icon without dropdown
  if (isSynced) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="h-10 w-10 flex items-center justify-center">
            <Package className="text-green-500" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Equipment is synced</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 p-0"
              disabled={isDisabled}
            >
              <Package className="text-blue-500" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isUnsynced ? "No equipment" : "Equipment out of sync"}</p>
        </TooltipContent>
      </Tooltip>
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